-- Origen y responsable del contacto, cartera restringida al responsable,
-- y resultado obligatorio de cada actividad.
-- El vendedor ve y edita los contactos que tiene asignados. También puede leer
-- un contacto o un inmueble ajeno cuando tiene una oportunidad activa vinculada,
-- para poder trabajar esa negociación. Reasignar queda para administrador y
-- responsable comercial (ve_todo).

alter table public.contactos
    add column origen_id uuid references public.origenes (id) on delete set null,
    add column responsable_id uuid;

update public.contactos c
set responsable_id = coalesce(
    (select u.id from public.usuarios u where u.id = c.creado_por and u.activo limit 1),
    (select u.id from public.usuarios u where u.activo order by (u.rol = 'ADMINISTRADOR') desc, u.creado_en limit 1)
)
where c.responsable_id is null;

do $chk$
begin
    if exists (select 1 from public.contactos where responsable_id is null) then
        raise exception 'Hay contactos sin responsable y no hay un usuario activo para asignarlos';
    end if;
end;
$chk$;

alter table public.contactos
    alter column responsable_id set not null;

alter table public.contactos
    add constraint contactos_responsable_id_fkey
    foreign key (responsable_id) references public.usuarios (id) on delete restrict;

create index contactos_origen_id_idx on public.contactos (origen_id);
create index contactos_responsable_id_idx on public.contactos (responsable_id);

-- ---------------------------------------------------------------------------
-- Quién ve y quién edita un contacto o un inmueble. SECURITY DEFINER para no
-- reentrar en RLS.
-- ---------------------------------------------------------------------------

create or replace function public.ve_contacto(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
    select public.ve_todo()
        or exists (
            select 1 from public.contactos c
            where c.id = p_id
              and c.responsable_id = (select auth.uid())
        )
        or exists (
            select 1 from public.oportunidades o
            where o.contacto_id = p_id
              and o.responsable_id = (select auth.uid())
              and o.activo
        )
        or exists (
            select 1
            from public.inmuebles i
            join public.oportunidades o on o.inmueble_id = i.id
            where i.contacto_id = p_id
              and o.responsable_id = (select auth.uid())
              and o.activo
        );
$func$;

create or replace function public.edita_contacto(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
    select public.ve_todo()
        or exists (
            select 1 from public.contactos c
            where c.id = p_id
              and c.responsable_id = (select auth.uid())
        );
$func$;

create or replace function public.ve_inmueble(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
    select public.ve_todo()
        or exists (
            select 1 from public.inmuebles i
            where i.id = p_id
              and public.ve_contacto(i.contacto_id)
        )
        or exists (
            select 1 from public.oportunidades o
            where o.inmueble_id = p_id
              and o.responsable_id = (select auth.uid())
              and o.activo
        );
$func$;

create or replace function public.proteger_responsable_contacto()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
    if auth.uid() is null or public.ve_todo() then
        return new;
    end if;
    if tg_op = 'INSERT' and new.responsable_id is distinct from auth.uid() then
        raise exception 'Solo podés registrar contactos a tu nombre';
    end if;
    if tg_op = 'UPDATE' and new.responsable_id is distinct from old.responsable_id then
        raise exception 'Solo un administrador o el responsable comercial puede reasignar un contacto';
    end if;
    return new;
end;
$func$;

create trigger contactos_proteger_responsable
    before insert or update on public.contactos
    for each row execute function public.proteger_responsable_contacto();

drop policy if exists contactos_select on public.contactos;
drop policy if exists contactos_insert on public.contactos;
drop policy if exists contactos_update on public.contactos;

create policy contactos_select on public.contactos
    for select to authenticated
    using (public.es_usuario_activo() and public.ve_contacto(id));

create policy contactos_insert on public.contactos
    for insert to authenticated
    with check (
        public.es_usuario_activo()
        and (public.ve_todo() or responsable_id = (select auth.uid()))
    );

create policy contactos_update on public.contactos
    for update to authenticated
    using (public.edita_contacto(id))
    with check (
        public.es_usuario_activo()
        and (public.ve_todo() or responsable_id = (select auth.uid()))
    );

drop policy if exists inmuebles_select on public.inmuebles;
drop policy if exists inmuebles_insert on public.inmuebles;
drop policy if exists inmuebles_update on public.inmuebles;

create policy inmuebles_select on public.inmuebles
    for select to authenticated
    using (public.es_usuario_activo() and public.ve_inmueble(id));

create policy inmuebles_insert on public.inmuebles
    for insert to authenticated
    with check (public.es_usuario_activo() and public.edita_contacto(contacto_id));

create policy inmuebles_update on public.inmuebles
    for update to authenticated
    using (public.edita_contacto(contacto_id))
    with check (public.edita_contacto(contacto_id));

-- ---------------------------------------------------------------------------
-- Resultado de la actividad. Las ya cargadas pueden no tenerlo; las nuevas no.
-- ---------------------------------------------------------------------------

alter table public.actividades
    add column resultado text;

alter table public.actividades
    add constraint actividades_resultado_largo check (resultado is null or char_length(resultado) <= 2000);

create or replace function public.validar_alta_actividad()
returns trigger
language plpgsql
set search_path = public
as $func$
declare
    op_contacto uuid;
    op_inmueble uuid;
begin
    if new.resultado is null or btrim(new.resultado) = '' then
        raise exception 'La actividad tiene que registrar un resultado';
    end if;

    if new.fecha > now() + interval '5 minutes' then
        raise exception 'La fecha de la actividad no puede ser futura';
    end if;

    if not exists (select 1 from public.tipos_actividad where id = new.tipo_id and activo) then
        raise exception 'El tipo de actividad no existe o está desactivado';
    end if;

    if new.oportunidad_id is not null then
        select contacto_id, inmueble_id into op_contacto, op_inmueble
        from public.oportunidades
        where id = new.oportunidad_id;

        if not found then
            raise exception 'La oportunidad no existe o no tenés acceso';
        end if;

        if new.contacto_id is not null and new.contacto_id <> op_contacto then
            raise exception 'El contacto no coincide con el de la oportunidad';
        end if;
        if new.inmueble_id is not null and op_inmueble is not null and new.inmueble_id <> op_inmueble then
            raise exception 'El inmueble no coincide con el de la oportunidad';
        end if;

        new.contacto_id := op_contacto;
        new.inmueble_id := coalesce(new.inmueble_id, op_inmueble);
    end if;

    new.activo := true;
    new.dado_de_baja_por := null;
    new.dado_de_baja_en := null;
    return new;
end;
$func$;

create or replace function public.proteger_actividad()
returns trigger
language plpgsql
as $func$
begin
    if (new.tipo_id, new.titulo, new.descripcion, new.resultado, new.fecha, new.usuario_id,
        new.contacto_id, new.inmueble_id, new.oportunidad_id, new.creado_en)
       is distinct from
       (old.tipo_id, old.titulo, old.descripcion, old.resultado, old.fecha, old.usuario_id,
        old.contacto_id, old.inmueble_id, old.oportunidad_id, old.creado_en) then
        raise exception 'Una actividad registrada no se modifica: dala de baja y registrá una nueva';
    end if;

    if new.activo and not old.activo then
        raise exception 'Una actividad dada de baja no se puede reactivar';
    end if;

    if old.activo and not new.activo then
        new.dado_de_baja_por := coalesce(auth.uid(), new.dado_de_baja_por);
        new.dado_de_baja_en := now();
    else
        new.dado_de_baja_por := old.dado_de_baja_por;
        new.dado_de_baja_en := old.dado_de_baja_en;
    end if;

    return new;
end;
$func$;

drop policy if exists actividades_select on public.actividades;
drop policy if exists actividades_insert on public.actividades;

create policy actividades_select on public.actividades
    for select to authenticated
    using (
        public.es_usuario_activo()
        and (
            public.ve_todo()
            or (
                oportunidad_id is not null
                and exists (
                    select 1 from public.oportunidades o
                    where o.id = actividades.oportunidad_id
                      and o.responsable_id = (select auth.uid())
                )
            )
            or (contacto_id is not null and public.ve_contacto(contacto_id))
            or (inmueble_id is not null and public.ve_inmueble(inmueble_id))
        )
    );

create policy actividades_insert on public.actividades
    for insert to authenticated
    with check (
        usuario_id = (select auth.uid())
        and public.es_usuario_activo()
        and (
            public.ve_todo()
            or (
                oportunidad_id is not null
                and exists (
                    select 1 from public.oportunidades o
                    where o.id = actividades.oportunidad_id
                      and (public.ve_todo() or o.responsable_id = (select auth.uid()))
                )
            )
            or (contacto_id is not null and public.ve_contacto(contacto_id))
            or (inmueble_id is not null and public.ve_inmueble(inmueble_id))
        )
    );
