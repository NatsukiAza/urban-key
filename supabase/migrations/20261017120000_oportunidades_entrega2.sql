-- Entrega 2 — Oportunidades y embudo configurable.
-- Etapas configurables sin romper datos, historial de etapas por trigger,
-- cierre con valor final y oportunidades cerradas protegidas en la base.

-- ---------------------------------------------------------------------------
-- Etapas configurables
-- ---------------------------------------------------------------------------

alter table public.etapas
    add column actualizado_en timestamptz not null default now();

create trigger etapas_actualizado_en before update on public.etapas
    for each row execute function public.set_actualizado_en();

-- Diferible para poder reordenar (intercambiar órdenes) dentro de una transacción.
alter table public.etapas drop constraint etapas_orden_unico;
alter table public.etapas
    add constraint etapas_orden_unico unique (funnel_id, orden) deferrable initially deferred;

-- Las etapas de cierre no se desactivan, y una etapa con oportunidades abiertas
-- tampoco: primero hay que moverlas.
create or replace function public.validar_cambio_etapa_config()
returns trigger
language plpgsql
as $func$
begin
    if new.resultado <> old.resultado or new.funnel_id <> old.funnel_id then
        raise exception 'No se puede cambiar el resultado ni el funnel de una etapa existente';
    end if;

    if old.activo and not new.activo then
        if old.resultado <> 'ABIERTA' then
            raise exception 'Las etapas de cierre (ganada/perdida) no se pueden desactivar';
        end if;
        if exists (
            select 1 from public.oportunidades
            where etapa_id = old.id and estado = 'ABIERTA' and activo
        ) then
            raise exception 'La etapa tiene oportunidades abiertas; movelas antes de desactivarla';
        end if;
    end if;

    return new;
end;
$func$;

create trigger etapas_validar_cambio
    before update on public.etapas
    for each row execute function public.validar_cambio_etapa_config();

-- Reordena las etapas abiertas de un funnel según el arreglo recibido.
-- Corre con los permisos del que llama: la RLS deja escribir solo al administrador.
create or replace function public.reordenar_etapas(p_funnel_id uuid, p_etapa_ids uuid[])
returns void
language plpgsql
set search_path = public
as $func$
declare
    cantidad_abiertas int;
begin
    select count(*) into cantidad_abiertas
    from public.etapas
    where funnel_id = p_funnel_id and resultado = 'ABIERTA';

    if cardinality(p_etapa_ids) <> cantidad_abiertas
       or exists (
           select 1 from unnest(p_etapa_ids) as x(id)
           where not exists (
               select 1 from public.etapas e
               where e.id = x.id and e.funnel_id = p_funnel_id and e.resultado = 'ABIERTA'
           )
       ) then
        raise exception 'El nuevo orden tiene que incluir exactamente las etapas abiertas del funnel';
    end if;

    update public.etapas e
    set orden = x.pos
    from unnest(p_etapa_ids) with ordinality as x(id, pos)
    where e.id = x.id;

    -- Las de cierre quedan siempre al final, en su orden relativo actual.
    update public.etapas e
    set orden = cantidad_abiertas + f.pos
    from (
        select id, row_number() over (order by orden) as pos
        from public.etapas
        where funnel_id = p_funnel_id and resultado <> 'ABIERTA'
    ) f
    where e.id = f.id;
end;
$func$;

-- ---------------------------------------------------------------------------
-- Oportunidades
-- ---------------------------------------------------------------------------

-- No se puede mover una oportunidad a una etapa desactivada. Las que ya estaban
-- en ella se conservan.
create or replace function public.validar_etapa_oportunidad()
returns trigger
language plpgsql
as $func$
declare
    etapa_funnel uuid;
    etapa_resultado estado_oportunidad;
    etapa_activa boolean;
begin
    select funnel_id, resultado, activo into etapa_funnel, etapa_resultado, etapa_activa
    from public.etapas
    where id = new.etapa_id;

    if etapa_funnel is null then
        raise exception 'La etapa % no existe', new.etapa_id;
    end if;

    if etapa_funnel <> new.funnel_id then
        raise exception 'La etapa no pertenece al funnel de la oportunidad';
    end if;

    if etapa_resultado <> new.estado then
        raise exception 'El estado % no es compatible con la etapa (resultado %)', new.estado, etapa_resultado;
    end if;

    if not etapa_activa and (tg_op = 'INSERT' or new.etapa_id <> old.etapa_id) then
        raise exception 'La etapa está desactivada';
    end if;

    return new;
end;
$func$;

-- Regla 5: ganada con montos registra valor final. NOT VALID para no romper
-- oportunidades ganadas que ya existían sin ese dato.
alter table public.oportunidades
    add constraint oportunidades_ganada_con_valor_final
    check (estado <> 'GANADA' or valor_estimado is null or valor_final is not null) not valid;

-- Regla 10: una oportunidad cerrada solo la modifica un administrador.
-- auth.uid() nulo = service_role o scripts de carga.
create or replace function public.proteger_oportunidad_cerrada()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
    if old.estado <> 'ABIERTA' and auth.uid() is not null and not public.es_admin() then
        raise exception 'La oportunidad está cerrada; solo un administrador puede modificarla'
            using errcode = '42501';
    end if;
    return new;
end;
$func$;

create trigger oportunidades_proteger_cerrada
    before update on public.oportunidades
    for each row execute function public.proteger_oportunidad_cerrada();

-- ---------------------------------------------------------------------------
-- Historial de etapas por trigger (regla 7)
-- La app deja la observación del movimiento en nota_cambio_etapa, en el mismo
-- update que cambia la etapa; el trigger la copia al historial.
-- ---------------------------------------------------------------------------

alter table public.oportunidades
    add column nota_cambio_etapa text;

create or replace function public.registrar_historial_etapa()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
    if tg_op = 'UPDATE' and new.etapa_id = old.etapa_id then
        return null;
    end if;

    insert into public.historial_etapas (oportunidad_id, etapa_anterior_id, etapa_nueva_id, usuario_id, observacion)
    values (
        new.id,
        case when tg_op = 'UPDATE' then old.etapa_id end,
        new.etapa_id,
        coalesce(auth.uid(), new.actualizado_por),
        new.nota_cambio_etapa
    );
    return null;
end;
$func$;

create trigger oportunidades_historial_etapa
    after insert or update of etapa_id on public.oportunidades
    for each row execute function public.registrar_historial_etapa();

-- El historial ya no lo inserta la app: se cierra la escritura directa.
drop policy if exists historial_etapas_insert on public.historial_etapas;

-- ---------------------------------------------------------------------------
-- Usuarios: unifica las dos versiones de proteger_rol_usuario
-- (20260924190000_registro_inmobiliaria y 20260924223000_sucursales_visibilidad).
-- La de sucursales pisaba a la de registro y bloqueaba el alta que hace el
-- servidor (service_role) al registrar la inmobiliaria y los empleados.
-- ---------------------------------------------------------------------------

create or replace function public.proteger_rol_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
    if coalesce(auth.role(), '') = 'service_role' then
        return new;
    end if;

    if (
        new.rol is distinct from old.rol
        or new.activo is distinct from old.activo
        or new.sucursal_id is distinct from old.sucursal_id
    ) and not public.es_admin() then
        raise exception 'Solo un administrador puede cambiar el rol, la sucursal o dar de baja a un usuario';
    end if;

    if new.debe_cambiar_contrasena is distinct from old.debe_cambiar_contrasena then
        raise exception 'No podés cambiar la obligación de contraseña';
    end if;

    return new;
end;
$func$;
