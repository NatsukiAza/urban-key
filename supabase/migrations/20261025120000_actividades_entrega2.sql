-- Entrega 2 — Actividades e historial comercial (specs/02-actividades.md).
-- Tipos de actividad configurables, actividades inmutables con baja lógica,
-- vínculo coherente con la oportunidad y lectura acotada a lo que se puede ver.

-- ---------------------------------------------------------------------------
-- Tipos de actividad: pasan de enum a tabla porque los configura el Administrador.
-- `clave` marca los tipos de sistema, que la app busca por código y no se desactivan.
-- ---------------------------------------------------------------------------

create table public.tipos_actividad (
    id uuid primary key default gen_random_uuid(),
    nombre text not null unique,
    clave text unique,
    activo boolean not null default true,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create trigger tipos_actividad_actualizado_en before update on public.tipos_actividad
    for each row execute function public.set_actualizado_en();

create or replace function public.proteger_tipo_actividad_sistema()
returns trigger
language plpgsql
as $func$
begin
    if old.clave is not null and (new.clave is distinct from old.clave or not new.activo) then
        raise exception 'El tipo "%" es de sistema: no se puede desactivar ni cambiar su clave', old.nombre;
    end if;
    return new;
end;
$func$;

create trigger tipos_actividad_proteger_sistema
    before update on public.tipos_actividad
    for each row execute function public.proteger_tipo_actividad_sistema();

insert into public.tipos_actividad (nombre, clave) values
    ('Llamada', null),
    ('Visita', null),
    ('Mensaje', null),
    ('Email', null),
    ('Reunión', null),
    ('Tasación', null),
    ('Observación', 'OBSERVACION')
on conflict (nombre) do nothing;

alter table public.tipos_actividad enable row level security;

create policy tipos_actividad_select on public.tipos_actividad
    for select to authenticated using (public.es_usuario_activo());
create policy tipos_actividad_admin on public.tipos_actividad
    for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- ---------------------------------------------------------------------------
-- actividades.tipo (enum) → actividades.tipo_id (tabla). Las observaciones del
-- contacto se guardaban como MENSAJE con título "Observación": pasan a su tipo.
-- ---------------------------------------------------------------------------

alter table public.actividades
    add column tipo_id uuid references public.tipos_actividad (id) on delete restrict;

update public.actividades a
set tipo_id = t.id
from public.tipos_actividad t
where t.clave = 'OBSERVACION'
  and a.tipo = 'MENSAJE'
  and a.titulo = 'Observación';

update public.actividades a
set tipo_id = t.id
from public.tipos_actividad t
where a.tipo_id is null
  and t.nombre = case a.tipo
      when 'LLAMADA' then 'Llamada'
      when 'VISITA' then 'Visita'
      when 'MENSAJE' then 'Mensaje'
      when 'EMAIL' then 'Email'
      when 'REUNION' then 'Reunión'
      when 'TASACION' then 'Tasación'
  end;

alter table public.actividades alter column tipo_id set not null;
alter table public.actividades drop column tipo;
drop type public.tipo_actividad;

create index actividades_tipo_id_idx on public.actividades (tipo_id);
create index actividades_inmueble_id_idx on public.actividades (inmueble_id);

-- ---------------------------------------------------------------------------
-- Baja lógica con auditoría (reglas 9 y 13).
-- ---------------------------------------------------------------------------

alter table public.actividades
    add column activo boolean not null default true,
    add column dado_de_baja_por uuid references public.usuarios (id) on delete set null,
    add column dado_de_baja_en timestamptz,
    add constraint actividades_baja_con_fecha check (activo or dado_de_baja_en is not null);

create index actividades_activo_idx on public.actividades (activo);

-- ---------------------------------------------------------------------------
-- Alta: la actividad ya ocurrió, su tipo está activo, y si pertenece a una
-- oportunidad hereda (o tiene que coincidir con) su contacto e inmueble.
-- Corre con los permisos del que inserta: si no ve la oportunidad, no la encuentra.
-- ---------------------------------------------------------------------------

create or replace function public.validar_alta_actividad()
returns trigger
language plpgsql
set search_path = public
as $func$
declare
    op_contacto uuid;
    op_inmueble uuid;
begin
    -- Cinco minutos de tolerancia por diferencias de reloj entre navegador y servidor.
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

create trigger actividades_validar_alta
    before insert on public.actividades
    for each row execute function public.validar_alta_actividad();

-- ---------------------------------------------------------------------------
-- Modificación: el historial no se pisa. Lo único permitido es la baja lógica,
-- que no se revierte y deja registrado quién y cuándo.
-- ---------------------------------------------------------------------------

create or replace function public.proteger_actividad()
returns trigger
language plpgsql
as $func$
begin
    if (new.tipo_id, new.titulo, new.descripcion, new.fecha, new.usuario_id,
        new.contacto_id, new.inmueble_id, new.oportunidad_id, new.creado_en)
       is distinct from
       (old.tipo_id, old.titulo, old.descripcion, old.fecha, old.usuario_id,
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

create trigger actividades_proteger
    before update on public.actividades
    for each row execute function public.proteger_actividad();

-- ---------------------------------------------------------------------------
-- RLS. Lectura y alta acotadas igual que las oportunidades: una actividad de una
-- oportunidad ajena no se ve ni se registra. Sin DELETE: regla 9.
-- ---------------------------------------------------------------------------

drop policy if exists actividades_select on public.actividades;
drop policy if exists actividades_insert on public.actividades;
drop policy if exists actividades_delete on public.actividades;

create policy actividades_select on public.actividades
    for select to authenticated
    using (
        public.es_usuario_activo()
        and (
            oportunidad_id is null
            or exists (
                select 1 from public.oportunidades o
                where o.id = actividades.oportunidad_id
                  and (public.ve_todo() or o.responsable_id = (select auth.uid()))
            )
        )
    );

create policy actividades_insert on public.actividades
    for insert to authenticated
    with check (
        usuario_id = (select auth.uid())
        and public.es_usuario_activo()
        and (
            oportunidad_id is null
            or exists (
                select 1 from public.oportunidades o
                where o.id = actividades.oportunidad_id
                  and (public.ve_todo() or o.responsable_id = (select auth.uid()))
            )
        )
    );

-- actividades_update (autor o admin) se mantiene: el trigger limita qué cambia.

-- ---------------------------------------------------------------------------
-- Orígenes: mismo esquema de auditoría que el resto de la configuración.
-- ---------------------------------------------------------------------------

alter table public.origenes
    add column actualizado_en timestamptz not null default now();

create trigger origenes_actualizado_en before update on public.origenes
    for each row execute function public.set_actualizado_en();
