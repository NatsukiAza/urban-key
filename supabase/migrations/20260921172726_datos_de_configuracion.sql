-- Datos de configuración que la app necesita para arrancar: los 4 funnels con sus
-- etapas, los orígenes y los motivos de pérdida. Son los mismos valores que hoy
-- genera lib/mock/seed.ts, para que migrar de mock a Supabase no cambie el comportamiento.
--
-- No es data de prueba: el Administrador los edita desde la app. Por eso va en una
-- migración y no en supabase/seed.sql (que solo corre en el entorno local).
-- Todo idempotente: volver a aplicarlo no duplica nada.

insert into public.funnels (tipo, nombre) values
    ('CAPTACION_VENTA', 'Captación Venta'),
    ('CAPTACION_ALQUILER', 'Captación Alquiler'),
    ('INTERESADOS_COMPRA', 'Interesados Compra'),
    ('INTERESADOS_ALQUILER', 'Interesados Alquiler')
on conflict (tipo) do nothing;

-- es_final se deriva del resultado: toda etapa que no deja la oportunidad ABIERTA cierra.
insert into public.etapas (funnel_id, nombre, orden, resultado, es_final)
select f.id, e.nombre, e.orden, e.resultado, e.resultado <> 'ABIERTA'
from (values
    -- Captación Venta
    ('CAPTACION_VENTA'::tipo_funnel, 'Consulta', 1, 'ABIERTA'::estado_oportunidad),
    ('CAPTACION_VENTA', 'Tasación', 2, 'ABIERTA'),
    ('CAPTACION_VENTA', 'Publicación', 3, 'ABIERTA'),
    ('CAPTACION_VENTA', 'Negociación', 4, 'ABIERTA'),
    ('CAPTACION_VENTA', 'Reserva', 5, 'ABIERTA'),
    ('CAPTACION_VENTA', 'Operación concretada', 6, 'GANADA'),
    ('CAPTACION_VENTA', 'Perdida', 7, 'PERDIDA'),

    -- Captación Alquiler
    ('CAPTACION_ALQUILER', 'Consulta', 1, 'ABIERTA'),
    ('CAPTACION_ALQUILER', 'Relevamiento', 2, 'ABIERTA'),
    ('CAPTACION_ALQUILER', 'Publicación', 3, 'ABIERTA'),
    ('CAPTACION_ALQUILER', 'Negociación', 4, 'ABIERTA'),
    ('CAPTACION_ALQUILER', 'Reserva', 5, 'ABIERTA'),
    ('CAPTACION_ALQUILER', 'Contrato firmado', 6, 'GANADA'),
    ('CAPTACION_ALQUILER', 'Perdida', 7, 'PERDIDA'),

    -- Interesados Compra
    ('INTERESADOS_COMPRA', 'Consulta recibida', 1, 'ABIERTA'),
    ('INTERESADOS_COMPRA', 'Necesidad relevada', 2, 'ABIERTA'),
    ('INTERESADOS_COMPRA', 'Propiedades seleccionadas', 3, 'ABIERTA'),
    ('INTERESADOS_COMPRA', 'Visita realizada', 4, 'ABIERTA'),
    ('INTERESADOS_COMPRA', 'Negociación', 5, 'ABIERTA'),
    ('INTERESADOS_COMPRA', 'Reserva', 6, 'ABIERTA'),
    ('INTERESADOS_COMPRA', 'Operación concretada', 7, 'GANADA'),
    ('INTERESADOS_COMPRA', 'Perdida', 8, 'PERDIDA'),

    -- Interesados Alquiler
    ('INTERESADOS_ALQUILER', 'Consulta recibida', 1, 'ABIERTA'),
    ('INTERESADOS_ALQUILER', 'Necesidad relevada', 2, 'ABIERTA'),
    ('INTERESADOS_ALQUILER', 'Propiedades seleccionadas', 3, 'ABIERTA'),
    ('INTERESADOS_ALQUILER', 'Visita realizada', 4, 'ABIERTA'),
    ('INTERESADOS_ALQUILER', 'Negociación', 5, 'ABIERTA'),
    ('INTERESADOS_ALQUILER', 'Contrato firmado', 6, 'GANADA'),
    ('INTERESADOS_ALQUILER', 'Perdida', 7, 'PERDIDA')
) as e (tipo, nombre, orden, resultado)
join public.funnels f on f.tipo = e.tipo
on conflict (funnel_id, nombre) do nothing;

insert into public.origenes (nombre) values
    ('Portal web'),
    ('Referido'),
    ('Cartel en la propiedad'),
    ('Redes sociales'),
    ('Llamada directa')
on conflict (nombre) do nothing;

insert into public.motivos_perdida (nombre) values
    ('Precio'),
    ('Eligió la competencia'),
    ('Desistió de la operación'),
    ('Sin respuesta'),
    ('Financiación')
on conflict (nombre) do nothing;
