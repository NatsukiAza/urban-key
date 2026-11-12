alter type public.tipo_funnel rename value 'CAPTACION_VENTA' to 'PROPIETARIOS';

update public.funnels set nombre = 'Propietarios' where tipo = 'PROPIETARIOS';

create temporary table mapeo_etapas on commit drop as
select
    vieja.id as vieja_id,
    coalesce(
        (
            select n.id
            from public.etapas n
            where n.funnel_id = prop.id
              and n.activo
              and n.resultado = vieja.resultado
              and n.nombre = case vieja.nombre
                  when 'Relevamiento' then 'Tasación'
                  when 'Contrato firmado' then 'Operación concretada'
                  else vieja.nombre
              end
        ),
        (
            select n.id
            from public.etapas n
            where n.funnel_id = prop.id
              and n.activo
              and n.resultado = vieja.resultado
            order by abs(n.orden - vieja.orden), n.orden
            limit 1
        )
    ) as nueva_id
from public.etapas vieja
join public.funnels alq on alq.id = vieja.funnel_id and alq.tipo = 'CAPTACION_ALQUILER'
cross join public.funnels prop
where prop.tipo = 'PROPIETARIOS';

do $$
begin
    if exists (select 1 from mapeo_etapas where nueva_id is null) then
        raise exception 'Hay etapas de Captación Alquiler sin etapa equivalente en Propietarios';
    end if;
end;
$$;

alter table public.oportunidades disable trigger oportunidades_proteger_cerrada;
alter table public.oportunidades disable trigger oportunidades_historial_etapa;
alter table public.oportunidades disable trigger oportunidades_actualizado_en;

update public.oportunidades o
set funnel_id = (select id from public.funnels where tipo = 'PROPIETARIOS'),
    etapa_id = m.nueva_id
from mapeo_etapas m
where o.etapa_id = m.vieja_id;

alter table public.oportunidades enable trigger oportunidades_proteger_cerrada;
alter table public.oportunidades enable trigger oportunidades_historial_etapa;
alter table public.oportunidades enable trigger oportunidades_actualizado_en;

update public.historial_etapas h
set etapa_anterior_id = m.nueva_id
from mapeo_etapas m
where h.etapa_anterior_id = m.vieja_id;

update public.historial_etapas h
set etapa_nueva_id = m.nueva_id
from mapeo_etapas m
where h.etapa_nueva_id = m.vieja_id;

delete from public.funnels where tipo = 'CAPTACION_ALQUILER';

alter type public.tipo_funnel rename to tipo_funnel_viejo;

create type public.tipo_funnel as enum ('PROPIETARIOS', 'INTERESADOS_COMPRA', 'INTERESADOS_ALQUILER');

alter table public.funnels
    alter column tipo type public.tipo_funnel using tipo::text::public.tipo_funnel;

drop type public.tipo_funnel_viejo;
