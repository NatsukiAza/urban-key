-- Registro único de la inmobiliaria y alta de empleados.
-- El primer usuario queda como administrador. Los siguientes solo los crea
-- el servidor (service_role). La contraseña temporal se marca en el perfil
-- y el usuario no puede apagar ese flag por su cuenta.

alter table public.usuarios
    add column debe_cambiar_contrasena boolean not null default false;

-- ---------------------------------------------------------------------------
-- Alta de perfil. Ignora cualquier rol que venga en la metadata del cliente.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
declare
    hay_admin boolean;
    es_service boolean;
    rol_nuevo public.rol_usuario;
begin
    es_service := coalesce(auth.role(), '') = 'service_role';

    select exists (
        select 1
        from public.usuarios
        where rol = 'ADMINISTRADOR'
          and activo
    ) into hay_admin;

    if hay_admin and not es_service then
        raise exception 'El alta de usuarios la hace el administrador';
    end if;

    rol_nuevo := case when hay_admin then 'VENDEDOR'::public.rol_usuario else 'ADMINISTRADOR'::public.rol_usuario end;

    insert into public.usuarios (id, email, nombre, apellido, rol)
    values (
        new.id,
        coalesce(new.email, ''),
        coalesce(new.raw_user_meta_data ->> 'nombre', ''),
        coalesce(new.raw_user_meta_data ->> 'apellido', ''),
        rol_nuevo
    )
    on conflict (id) do nothing;

    return new;
end;
$func$;

-- ---------------------------------------------------------------------------
-- Rol, baja lógica y el flag de contraseña temporal.
-- service_role puede tocarlos. El resto no apaga debe_cambiar_contrasena.
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

    if (new.rol is distinct from old.rol or new.activo is distinct from old.activo)
       and not public.es_admin() then
        raise exception 'Solo un administrador puede cambiar el rol o dar de baja a un usuario';
    end if;

    if new.debe_cambiar_contrasena is distinct from old.debe_cambiar_contrasena then
        raise exception 'No podés cambiar la obligación de contraseña';
    end if;

    return new;
end;
$func$;

-- La llama el servidor después de cambiar la contraseña en Auth.
-- Solo service_role: el usuario autenticado no puede ejecutarla.
create or replace function public.confirmar_contrasena_cambiada(p_usuario_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $func$
begin
    if coalesce(auth.role(), '') is distinct from 'service_role' then
        raise exception 'No autorizado';
    end if;

    update public.usuarios
    set debe_cambiar_contrasena = false
    where id = p_usuario_id;
end;
$func$;

revoke all on function public.confirmar_contrasena_cambiada(uuid) from public;
grant execute on function public.confirmar_contrasena_cambiada(uuid) to service_role;

-- Crea la inmobiliaria y su sucursal inicial y las liga al primer administrador.
-- Si ya hay una inmobiliaria, falla. El lock evita dos altas simultáneas.
create or replace function public.vincular_inmobiliaria_inicial(p_usuario_id uuid, p_nombre text)
returns uuid
language plpgsql
security definer
set search_path = public
as $func$
declare
    inmobiliaria uuid;
    sucursal uuid;
    nombre_limpio text := btrim(p_nombre);
begin
    if coalesce(auth.role(), '') is distinct from 'service_role' then
        raise exception 'No autorizado';
    end if;

    if nombre_limpio = '' then
        raise exception 'El nombre de la inmobiliaria es obligatorio';
    end if;

    perform pg_advisory_xact_lock(hashtext('urbankey_inmobiliaria_inicial'));

    if exists (select 1 from public.inmobiliarias) then
        raise exception 'Ya existe una inmobiliaria';
    end if;

    insert into public.inmobiliarias (nombre)
    values (nombre_limpio)
    returning id into inmobiliaria;

    insert into public.sucursales (inmobiliaria_id, nombre)
    values (inmobiliaria, 'Casa central')
    returning id into sucursal;

    update public.usuarios
    set sucursal_id = sucursal,
        rol = 'ADMINISTRADOR'
    where id = p_usuario_id;

    if not found then
        raise exception 'No se encontró el usuario administrador';
    end if;

    return inmobiliaria;
end;
$func$;

revoke all on function public.vincular_inmobiliaria_inicial(uuid, text) from public;
grant execute on function public.vincular_inmobiliaria_inicial(uuid, text) to service_role;
