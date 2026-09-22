-- RLS: la frontera de seguridad real de UrbanKey (specs/_base/acceso-y-roles.md).
-- El chequeo de rol en Server Actions es defensa en profundidad; lo que manda es esto.
--
-- Criterio por tabla:
--   · Configuración (inmobiliarias, sucursales, funnels, etapas, orígenes, motivos):
--     la lee cualquier usuario activo, la escribe solo el ADMINISTRADOR.
--   · Cartera (contactos, inmuebles): compartida. Todo usuario activo la ve y la edita.
--     Resuelve provisoriamente la pregunta abierta de acceso-y-roles.md: el vendedor ve
--     toda la cartera. Si el equipo decide restringirla, se cambia acá y en ningún otro lado.
--   · Oportunidades: el VENDEDOR ve y edita solo lo suyo; RESPONSABLE_COMERCIAL y
--     ADMINISTRADOR ven todo.

-- ---------------------------------------------------------------------------
-- Helpers. SECURITY DEFINER a propósito: leen public.usuarios salteando su propio
-- RLS, que es lo que evita la recursión infinita al evaluar las políticas.
-- ---------------------------------------------------------------------------

create or replace function public.rol_actual()
returns rol_usuario
language sql
stable
security definer
set search_path = public
as $func$
    select rol from public.usuarios where id = auth.uid() and activo;
$func$;

create or replace function public.es_usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
    select exists (select 1 from public.usuarios where id = auth.uid() and activo);
$func$;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
    select public.rol_actual() = 'ADMINISTRADOR';
$func$;

-- Quién ve la cartera completa de oportunidades, no solo lo asignado.
create or replace function public.ve_todo()
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
    select public.rol_actual() in ('ADMINISTRADOR', 'RESPONSABLE_COMERCIAL');
$func$;

-- ---------------------------------------------------------------------------
-- Un usuario puede editar su perfil, pero no ascenderse solo. RLS no filtra por
-- columna, así que rol y activo se protegen con trigger.
-- ---------------------------------------------------------------------------

create or replace function public.proteger_rol_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
    if (new.rol is distinct from old.rol or new.activo is distinct from old.activo)
       and not public.es_admin() then
        raise exception 'Solo un administrador puede cambiar el rol o dar de baja a un usuario';
    end if;
    return new;
end;
$func$;

create trigger usuarios_proteger_rol
    before update on public.usuarios
    for each row execute function public.proteger_rol_usuario();

-- ---------------------------------------------------------------------------
-- RLS habilitado en toda tabla del dominio. Sin política que lo permita, se niega.
-- ---------------------------------------------------------------------------

alter table public.inmobiliarias enable row level security;
alter table public.sucursales enable row level security;
alter table public.usuarios enable row level security;
alter table public.contactos enable row level security;
alter table public.inmuebles enable row level security;
alter table public.funnels enable row level security;
alter table public.etapas enable row level security;
alter table public.origenes enable row level security;
alter table public.motivos_perdida enable row level security;
alter table public.oportunidades enable row level security;
alter table public.historial_etapas enable row level security;
alter table public.actividades enable row level security;

-- ---------------------------------------------------------------------------
-- Configuración: lectura para todos, escritura para el administrador.
-- ---------------------------------------------------------------------------

create policy inmobiliarias_select on public.inmobiliarias
    for select to authenticated using (public.es_usuario_activo());
create policy inmobiliarias_admin on public.inmobiliarias
    for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy sucursales_select on public.sucursales
    for select to authenticated using (public.es_usuario_activo());
create policy sucursales_admin on public.sucursales
    for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy funnels_select on public.funnels
    for select to authenticated using (public.es_usuario_activo());
create policy funnels_admin on public.funnels
    for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy etapas_select on public.etapas
    for select to authenticated using (public.es_usuario_activo());
create policy etapas_admin on public.etapas
    for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy origenes_select on public.origenes
    for select to authenticated using (public.es_usuario_activo());
create policy origenes_admin on public.origenes
    for all to authenticated using (public.es_admin()) with check (public.es_admin());

create policy motivos_perdida_select on public.motivos_perdida
    for select to authenticated using (public.es_usuario_activo());
create policy motivos_perdida_admin on public.motivos_perdida
    for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- ---------------------------------------------------------------------------
-- Usuarios. Se leen todos (pueblan el select de responsable). No hay política de
-- INSERT: la fila la crea el trigger on_auth_user_created al registrarse en Auth.
-- Tampoco de DELETE: baja lógica con activo = false.
-- ---------------------------------------------------------------------------

create policy usuarios_select on public.usuarios
    for select to authenticated using (public.es_usuario_activo());

create policy usuarios_update_propio on public.usuarios
    for update to authenticated
    using (id = (select auth.uid()) or public.es_admin())
    with check (id = (select auth.uid()) or public.es_admin());

-- ---------------------------------------------------------------------------
-- Cartera compartida: contactos e inmuebles.
-- ---------------------------------------------------------------------------

create policy contactos_select on public.contactos
    for select to authenticated using (public.es_usuario_activo());
create policy contactos_insert on public.contactos
    for insert to authenticated with check (public.es_usuario_activo());
create policy contactos_update on public.contactos
    for update to authenticated
    using (public.es_usuario_activo()) with check (public.es_usuario_activo());
create policy contactos_delete on public.contactos
    for delete to authenticated using (public.es_admin());

create policy inmuebles_select on public.inmuebles
    for select to authenticated using (public.es_usuario_activo());
create policy inmuebles_insert on public.inmuebles
    for insert to authenticated with check (public.es_usuario_activo());
create policy inmuebles_update on public.inmuebles
    for update to authenticated
    using (public.es_usuario_activo()) with check (public.es_usuario_activo());
create policy inmuebles_delete on public.inmuebles
    for delete to authenticated using (public.es_admin());

-- ---------------------------------------------------------------------------
-- Oportunidades: el vendedor solo toca lo que tiene asignado.
-- ---------------------------------------------------------------------------

create policy oportunidades_select on public.oportunidades
    for select to authenticated
    using (public.ve_todo() or responsable_id = (select auth.uid()));

create policy oportunidades_insert on public.oportunidades
    for insert to authenticated
    with check (
        public.es_usuario_activo()
        and (public.ve_todo() or responsable_id = (select auth.uid()))
    );

create policy oportunidades_update on public.oportunidades
    for update to authenticated
    using (public.ve_todo() or responsable_id = (select auth.uid()))
    with check (public.ve_todo() or responsable_id = (select auth.uid()));

-- Regla 9: no se borran, se dan de baja. El delete físico queda para el admin.
create policy oportunidades_delete on public.oportunidades
    for delete to authenticated using (public.es_admin());

-- ---------------------------------------------------------------------------
-- Historial de etapas: se ve y se escribe si se puede ver la oportunidad.
-- Sin UPDATE ni DELETE: regla 7, el historial no se pisa.
-- ---------------------------------------------------------------------------

create policy historial_etapas_select on public.historial_etapas
    for select to authenticated
    using (
        exists (
            select 1 from public.oportunidades o
            where o.id = historial_etapas.oportunidad_id
              and (public.ve_todo() or o.responsable_id = (select auth.uid()))
        )
    );

create policy historial_etapas_insert on public.historial_etapas
    for insert to authenticated
    with check (
        exists (
            select 1 from public.oportunidades o
            where o.id = historial_etapas.oportunidad_id
              and (public.ve_todo() or o.responsable_id = (select auth.uid()))
        )
    );

-- ---------------------------------------------------------------------------
-- Actividades: las lee todo el equipo; cada uno registra las suyas.
-- ---------------------------------------------------------------------------

create policy actividades_select on public.actividades
    for select to authenticated using (public.es_usuario_activo());

create policy actividades_insert on public.actividades
    for insert to authenticated with check (usuario_id = (select auth.uid()));

create policy actividades_update on public.actividades
    for update to authenticated
    using (usuario_id = (select auth.uid()) or public.es_admin())
    with check (usuario_id = (select auth.uid()) or public.es_admin());

create policy actividades_delete on public.actividades
    for delete to authenticated
    using (usuario_id = (select auth.uid()) or public.es_admin());
