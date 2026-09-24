-- Visibilidad de sucursales: el administrador ve todas; el resto solo la propia.
-- La asignación de sucursal la hace el administrador (el usuario no puede cambiársela).

create or replace function public.sucursal_actual()
returns uuid
language sql
stable
security definer
set search_path = public
as $func$
    select sucursal_id from public.usuarios where id = (select auth.uid()) and activo;
$func$;

drop policy if exists sucursales_select on public.sucursales;

create policy sucursales_select on public.sucursales
    for select to authenticated
    using (
        (select public.es_admin())
        or id = (select public.sucursal_actual())
    );

create unique index if not exists sucursales_inmobiliaria_nombre_uidx
    on public.sucursales (inmobiliaria_id, lower(nombre));

create or replace function public.proteger_rol_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
    if (
        new.rol is distinct from old.rol
        or new.activo is distinct from old.activo
        or new.sucursal_id is distinct from old.sucursal_id
    ) and not public.es_admin() then
        raise exception 'Solo un administrador puede cambiar el rol, la sucursal o dar de baja a un usuario';
    end if;
    return new;
end;
$func$;
