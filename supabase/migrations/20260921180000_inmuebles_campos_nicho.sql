alter table public.inmuebles
    add column if not exists localidad text,
    add column if not exists dormitorios integer,
    add column if not exists banos integer,
    add column if not exists cochera boolean not null default false,
    add column if not exists antiguedad integer,
    add column if not exists descripcion text;

comment on column public.inmuebles.localidad is 'Partido/localidad del GBA Oeste. Filtrable desde el listado.';
comment on column public.inmuebles.banos is 'Sin ñ: convención de nombres de columna.';
comment on column public.inmuebles.antiguedad is 'Años desde la construcción. 0 = a estrenar.';

alter table public.inmuebles
    add constraint inmuebles_dormitorios_positivos check (dormitorios is null or dormitorios > 0),
    add constraint inmuebles_banos_no_negativos check (banos is null or banos >= 0),
    add constraint inmuebles_antiguedad_no_negativa check (antiguedad is null or antiguedad >= 0),
    add constraint inmuebles_dormitorios_coherentes check (dormitorios is null or ambientes is null or dormitorios <= ambientes);

create index if not exists inmuebles_localidad_idx on public.inmuebles (localidad);
create index if not exists inmuebles_estado_idx on public.inmuebles (estado);
create index if not exists inmuebles_tipo_operacion_idx on public.inmuebles (tipo_operacion);
