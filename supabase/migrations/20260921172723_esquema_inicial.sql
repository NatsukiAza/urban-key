-- Esquema inicial de UrbanKey.
-- Modelo: specs/00-general.md + specs/_base/modelado-y-tipos.md, más inmobiliarias y
-- sucursales tomadas del diagrama de clases (Diagrama sin título.drawio).
-- Convenciones: tablas en español/plural/snake_case, PK uuid, auditoría y baja lógica.

-- ---------------------------------------------------------------------------
-- Enums de dominio (lo fijo). Lo configurable por el admin va en tablas.
-- ---------------------------------------------------------------------------

create type rol_usuario as enum ('ADMINISTRADOR', 'VENDEDOR', 'RESPONSABLE_COMERCIAL');
create type estado_contacto as enum ('POTENCIAL', 'CLIENTE', 'INACTIVO', 'NO_CONTACTAR');
create type estado_oportunidad as enum ('ABIERTA', 'GANADA', 'PERDIDA');
create type tipo_funnel as enum ('CAPTACION_VENTA', 'CAPTACION_ALQUILER', 'INTERESADOS_COMPRA', 'INTERESADOS_ALQUILER');
create type tipo_operacion as enum ('VENTA', 'ALQUILER');

-- Estos cuatro todavía no tienen su archivo en lib/enums/: los definen las features
-- de inmuebles y actividades. Los valores de acá son el punto de partida.
create type tipo_inmueble as enum ('CASA', 'DEPARTAMENTO', 'PH');
create type estado_inmueble as enum ('DISPONIBLE', 'RESERVADO', 'OPERADO', 'RETIRADO');
create type tipo_actividad as enum ('LLAMADA', 'VISITA', 'MENSAJE', 'EMAIL', 'REUNION', 'TASACION');
create type moneda as enum ('ARS', 'USD');

-- ---------------------------------------------------------------------------
-- Función de auditoría: mantiene actualizado_en al día en cada UPDATE.
-- ---------------------------------------------------------------------------

create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
as $func$
begin
    new.actualizado_en = now();
    return new;
end;
$func$;

-- ---------------------------------------------------------------------------
-- Estructura de la inmobiliaria
-- ---------------------------------------------------------------------------

create table public.inmobiliarias (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    cuit text unique,
    activo boolean not null default true,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create table public.sucursales (
    id uuid primary key default gen_random_uuid(),
    inmobiliaria_id uuid not null references public.inmobiliarias (id) on delete restrict,
    nombre text not null,
    direccion text,
    telefono text,
    activo boolean not null default true,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create index sucursales_inmobiliaria_id_idx on public.sucursales (inmobiliaria_id);

-- ---------------------------------------------------------------------------
-- Usuarios. El id ES el de auth.users: la contraseña la maneja Supabase Auth y
-- la app nunca guarda un hash propio (regla 12 de specs/00-general.md).
-- ---------------------------------------------------------------------------

create table public.usuarios (
    id uuid primary key references auth.users (id) on delete cascade,
    sucursal_id uuid references public.sucursales (id) on delete set null,
    nombre text not null default '',
    apellido text not null default '',
    email text not null unique,
    rol rol_usuario not null default 'VENDEDOR',
    activo boolean not null default true,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create index usuarios_sucursal_id_idx on public.usuarios (sucursal_id);
create index usuarios_rol_idx on public.usuarios (rol);

-- Al registrarse un usuario en Auth se crea su fila de perfil. El rol por defecto es
-- VENDEDOR; promoverlo a otro rol es tarea del administrador.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
    insert into public.usuarios (id, email, nombre, apellido)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'nombre', ''),
        coalesce(new.raw_user_meta_data ->> 'apellido', '')
    )
    on conflict (id) do nothing;
    return new;
end;
$func$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Contactos. Una persona: propietario y/o interesado (no hay entidad Empresa).
-- ---------------------------------------------------------------------------

create table public.contactos (
    id uuid primary key default gen_random_uuid(),
    sucursal_id uuid references public.sucursales (id) on delete set null,
    nombre text not null,
    apellido text not null,
    email text,
    telefono text,
    estado estado_contacto not null default 'POTENCIAL',
    es_propietario boolean not null default false,
    es_interesado boolean not null default false,
    observaciones text,
    activo boolean not null default true,
    creado_por uuid references public.usuarios (id) on delete set null,
    actualizado_por uuid references public.usuarios (id) on delete set null,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    constraint contactos_rol_minimo check (es_propietario or es_interesado)
);

create index contactos_estado_idx on public.contactos (estado);
create index contactos_activo_idx on public.contactos (activo);

-- ---------------------------------------------------------------------------
-- Inmuebles. Eje del negocio; pertenece a un contacto propietario.
-- ---------------------------------------------------------------------------

create table public.inmuebles (
    id uuid primary key default gen_random_uuid(),
    contacto_id uuid not null references public.contactos (id) on delete restrict,
    sucursal_id uuid references public.sucursales (id) on delete set null,
    nombre text,
    direccion text not null,
    tipo_operacion tipo_operacion not null,
    tipo_inmueble tipo_inmueble not null default 'DEPARTAMENTO',
    estado estado_inmueble not null default 'DISPONIBLE',
    ambientes integer,
    m2 numeric(10, 2),
    precio numeric(14, 2),
    moneda moneda not null default 'ARS',
    expensas numeric(14, 2),
    activo boolean not null default true,
    creado_por uuid references public.usuarios (id) on delete set null,
    actualizado_por uuid references public.usuarios (id) on delete set null,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    constraint inmuebles_ambientes_positivos check (ambientes is null or ambientes > 0),
    constraint inmuebles_m2_positivos check (m2 is null or m2 > 0),
    constraint inmuebles_precio_no_negativo check (precio is null or precio >= 0),
    constraint inmuebles_expensas_no_negativas check (expensas is null or expensas >= 0)
);

create index inmuebles_contacto_id_idx on public.inmuebles (contacto_id);
create index inmuebles_activo_idx on public.inmuebles (activo);

-- ---------------------------------------------------------------------------
-- Configuración comercial: funnels, etapas, orígenes y motivos de pérdida.
-- Son tablas y no enums porque las configura el Administrador.
-- ---------------------------------------------------------------------------

create table public.funnels (
    id uuid primary key default gen_random_uuid(),
    tipo tipo_funnel not null unique,
    nombre text not null,
    activo boolean not null default true,
    creado_en timestamptz not null default now()
);

create table public.etapas (
    id uuid primary key default gen_random_uuid(),
    funnel_id uuid not null references public.funnels (id) on delete cascade,
    nombre text not null,
    descripcion text,
    orden integer not null,
    es_final boolean not null default false,
    resultado estado_oportunidad not null default 'ABIERTA',
    activo boolean not null default true,
    creado_en timestamptz not null default now(),
    constraint etapas_orden_unico unique (funnel_id, orden),
    constraint etapas_nombre_unico unique (funnel_id, nombre),
    -- Una etapa es final exactamente cuando cierra la oportunidad (ganada o perdida).
    constraint etapas_final_coherente check (es_final = (resultado <> 'ABIERTA'))
);

create index etapas_funnel_id_idx on public.etapas (funnel_id);

create table public.origenes (
    id uuid primary key default gen_random_uuid(),
    nombre text not null unique,
    activo boolean not null default true,
    creado_en timestamptz not null default now()
);

create table public.motivos_perdida (
    id uuid primary key default gen_random_uuid(),
    nombre text not null unique,
    activo boolean not null default true,
    creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Oportunidades
-- ---------------------------------------------------------------------------

create table public.oportunidades (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    contacto_id uuid not null references public.contactos (id) on delete restrict,
    inmueble_id uuid references public.inmuebles (id) on delete set null,
    responsable_id uuid not null references public.usuarios (id) on delete restrict,
    funnel_id uuid not null references public.funnels (id) on delete restrict,
    etapa_id uuid not null references public.etapas (id) on delete restrict,
    origen_id uuid references public.origenes (id) on delete set null,
    motivo_perdida_id uuid references public.motivos_perdida (id) on delete set null,
    estado estado_oportunidad not null default 'ABIERTA',
    valor_estimado numeric(14, 2),
    valor_final numeric(14, 2),
    moneda moneda not null default 'ARS',
    observaciones text,
    fecha_cierre_estimada date,
    fecha_cierre_real timestamptz,
    activo boolean not null default true,
    creado_por uuid references public.usuarios (id) on delete set null,
    actualizado_por uuid references public.usuarios (id) on delete set null,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),

    -- Reglas 5 y 6 de specs/00-general.md: una oportunidad cerrada registra su fecha
    -- real de cierre, y una perdida además el motivo.
    constraint oportunidades_cierre_con_fecha check (estado = 'ABIERTA' or fecha_cierre_real is not null),
    constraint oportunidades_perdida_con_motivo check (estado <> 'PERDIDA' or motivo_perdida_id is not null),
    constraint oportunidades_abierta_sin_motivo check (estado <> 'ABIERTA' or motivo_perdida_id is null),
    constraint oportunidades_valores_no_negativos check (
        (valor_estimado is null or valor_estimado >= 0) and (valor_final is null or valor_final >= 0)
    )
);

create index oportunidades_responsable_id_idx on public.oportunidades (responsable_id);
create index oportunidades_funnel_id_idx on public.oportunidades (funnel_id);
create index oportunidades_etapa_id_idx on public.oportunidades (etapa_id);
create index oportunidades_contacto_id_idx on public.oportunidades (contacto_id);
create index oportunidades_estado_idx on public.oportunidades (estado);

-- Reglas 3 y 4: la etapa tiene que pertenecer al funnel de la oportunidad, y su
-- resultado tiene que coincidir con el estado. Va en trigger y no en CHECK porque
-- necesita mirar otra tabla.
create or replace function public.validar_etapa_oportunidad()
returns trigger
language plpgsql
as $func$
declare
    etapa_funnel uuid;
    etapa_resultado estado_oportunidad;
begin
    select funnel_id, resultado into etapa_funnel, etapa_resultado
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

    return new;
end;
$func$;

create trigger oportunidades_validar_etapa
    before insert or update of etapa_id, funnel_id, estado on public.oportunidades
    for each row execute function public.validar_etapa_oportunidad();

-- ---------------------------------------------------------------------------
-- Historial de etapas. Regla 7: cada cambio queda como registro independiente.
-- Lo escribe la Server Action (lib/oportunidad/actions.ts), no un trigger, para no
-- duplicar el registro que ya hace la app.
-- ---------------------------------------------------------------------------

create table public.historial_etapas (
    id uuid primary key default gen_random_uuid(),
    oportunidad_id uuid not null references public.oportunidades (id) on delete cascade,
    etapa_anterior_id uuid references public.etapas (id) on delete set null,
    etapa_nueva_id uuid not null references public.etapas (id) on delete restrict,
    usuario_id uuid references public.usuarios (id) on delete set null,
    observacion text,
    creado_en timestamptz not null default now()
);

create index historial_etapas_oportunidad_id_idx on public.historial_etapas (oportunidad_id);

-- ---------------------------------------------------------------------------
-- Actividades. Interacción ya ocurrida, no una tarea futura.
-- ---------------------------------------------------------------------------

create table public.actividades (
    id uuid primary key default gen_random_uuid(),
    tipo tipo_actividad not null,
    titulo text not null,
    descripcion text,
    fecha timestamptz not null default now(),
    usuario_id uuid not null references public.usuarios (id) on delete restrict,
    contacto_id uuid references public.contactos (id) on delete cascade,
    inmueble_id uuid references public.inmuebles (id) on delete cascade,
    oportunidad_id uuid references public.oportunidades (id) on delete cascade,
    creado_en timestamptz not null default now(),
    -- Regla 8: toda actividad se relaciona con contacto, inmueble u oportunidad.
    constraint actividades_con_relacion check (num_nonnulls(contacto_id, inmueble_id, oportunidad_id) >= 1)
);

create index actividades_oportunidad_id_idx on public.actividades (oportunidad_id);
create index actividades_contacto_id_idx on public.actividades (contacto_id);
create index actividades_fecha_idx on public.actividades (fecha desc);

-- ---------------------------------------------------------------------------
-- actualizado_en automático en las tablas que lo tienen.
-- ---------------------------------------------------------------------------

create trigger inmobiliarias_actualizado_en before update on public.inmobiliarias
    for each row execute function public.set_actualizado_en();
create trigger sucursales_actualizado_en before update on public.sucursales
    for each row execute function public.set_actualizado_en();
create trigger usuarios_actualizado_en before update on public.usuarios
    for each row execute function public.set_actualizado_en();
create trigger contactos_actualizado_en before update on public.contactos
    for each row execute function public.set_actualizado_en();
create trigger inmuebles_actualizado_en before update on public.inmuebles
    for each row execute function public.set_actualizado_en();
create trigger oportunidades_actualizado_en before update on public.oportunidades
    for each row execute function public.set_actualizado_en();
