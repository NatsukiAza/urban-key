'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server';
import { getUsuarioActual } from '../auth/session';
import { puedeReasignar } from '../auth/permisos';
import { oportunidadSchema, cambiarEtapaSchema, reasignarSchema } from './schema';
import type { ActionResult } from '../types';

type Supabase = Awaited<ReturnType<typeof createClient>>;

function revalidar(id?: string) {
    revalidatePath('/oportunidades');
    revalidatePath('/oportunidades/tablero');
    if (id) revalidatePath(`/oportunidades/${id}`);
}

const fallo = (mensaje: string): ActionResult<never> => ({ ok: false, error: true, mensaje });

function mensajeDeError(error: { code?: string; message: string }): string {
    switch (error.code) {
        case '42501':
            return 'No tenés permiso para realizar esta operación';
        case '23503':
            return 'Alguno de los datos relacionados no existe';
        case '23505':
            return 'Ya existe un registro con esos datos';
        case '23514':
            return 'Los datos no cumplen una regla del dominio';
        default:
            return error.message;
    }
}

async function getEtapa(supabase: Supabase, etapaId: string) {
    const { data, error } = await supabase.from('etapas').select('id, funnel_id, resultado').eq('id', etapaId).maybeSingle();
    if (error) {
        console.error('Error leyendo la etapa', error);
        return null;
    }
    return data;
}

async function getOportunidadParaEditar(supabase: Supabase, id: string) {
    const { data, error } = await supabase.from('oportunidades').select('id, estado, etapa_id, funnel_id, responsable_id, valor_estimado, creado_en').eq('id', id).eq('activo', true).maybeSingle();
    if (error) {
        console.error('Error leyendo la oportunidad', error);
        return null;
    }
    return data;
}

export async function crearOportunidad(input: unknown): Promise<ActionResult<{ id: string }>> {
    const parsed = oportunidadSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    const data = parsed.data;

    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');

    if (data.responsableId !== usuario.id && !puedeReasignar(usuario.rol)) return fallo('Solo podés crear oportunidades a tu nombre');

    const supabase = await createClient();

    const etapa = await getEtapa(supabase, data.etapaId);
    if (!etapa) return fallo('La etapa no existe');
    if (etapa.funnel_id !== data.funnelId) return fallo('La etapa no pertenece al funnel elegido');
    if (etapa.resultado !== 'ABIERTA') return fallo('Una oportunidad nueva debe iniciar en una etapa abierta');

    const { data: creada, error } = await supabase
        .from('oportunidades')
        .insert({
            titulo: data.titulo,
            contacto_id: data.contactoId,
            inmueble_id: data.inmuebleId,
            responsable_id: data.responsableId,
            funnel_id: data.funnelId,
            etapa_id: data.etapaId,
            estado: 'ABIERTA',
            valor_estimado: data.valorEstimado,
            moneda: data.moneda,
            origen_id: data.origenId,
            observaciones: data.observaciones,
            fecha_cierre_estimada: data.fechaCierreEstimada,
            nota_cambio_etapa: 'Alta de la oportunidad',
            creado_por: usuario.id,
            actualizado_por: usuario.id,
        })
        .select('id')
        .single();

    if (error || !creada) {
        console.error('Error creando la oportunidad', error);
        return fallo(error ? mensajeDeError(error) : 'No se pudo crear la oportunidad');
    }

    revalidar(creada.id);
    return { ok: true, mensaje: 'Oportunidad creada correctamente', data: { id: creada.id } };
}

export async function actualizarOportunidad(id: string, input: unknown): Promise<ActionResult> {
    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');

    const supabase = await createClient();

    const op = await getOportunidadParaEditar(supabase, id);
    if (!op) return fallo('Oportunidad no encontrada');
    if (op.estado !== 'ABIERTA') return fallo('La oportunidad está cerrada y no puede modificarse');

    const parsed = oportunidadSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    const data = parsed.data;
    if (data.responsableId !== op.responsable_id && !puedeReasignar(usuario.rol)) return fallo('No tenés permiso para reasignar el responsable');

    const etapa = await getEtapa(supabase, data.etapaId);
    if (!etapa) return fallo('La etapa no existe');
    if (etapa.funnel_id !== data.funnelId) return fallo('La etapa no pertenece al funnel elegido');
    if (etapa.resultado !== 'ABIERTA') return fallo('Para ganar o perder la oportunidad usá el tablero (cambio de etapa)');

    const { error } = await supabase
        .from('oportunidades')
        .update({
            titulo: data.titulo,
            contacto_id: data.contactoId,
            inmueble_id: data.inmuebleId,
            responsable_id: data.responsableId,
            funnel_id: data.funnelId,
            etapa_id: data.etapaId,
            valor_estimado: data.valorEstimado,
            moneda: data.moneda,
            origen_id: data.origenId,
            observaciones: data.observaciones,
            fecha_cierre_estimada: data.fechaCierreEstimada,
            nota_cambio_etapa: 'Cambio desde edición',
            actualizado_por: usuario.id,
        })
        .eq('id', id);

    if (error) {
        console.error('Error actualizando la oportunidad', error);
        return fallo(mensajeDeError(error));
    }

    revalidar(id);
    return { ok: true, mensaje: 'Oportunidad actualizada correctamente' };
}

export async function cambiarEtapa(input: unknown): Promise<ActionResult> {
    const parsed = cambiarEtapaSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    const { oportunidadId, etapaId, observacion, motivoPerdidaId, fechaCierre, valorFinal } = parsed.data;

    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');

    const supabase = await createClient();

    const op = await getOportunidadParaEditar(supabase, oportunidadId);
    if (!op) return fallo('Oportunidad no encontrada');
    if (op.estado !== 'ABIERTA') return fallo('La oportunidad está cerrada y no puede cambiar de etapa');

    const etapa = await getEtapa(supabase, etapaId);
    if (!etapa) return fallo('La etapa no existe');
    if (etapa.funnel_id !== op.funnel_id) return fallo('La etapa no pertenece al funnel de la oportunidad');

    const resultado = etapa.resultado;
    if (resultado === 'PERDIDA' && !motivoPerdidaId) return fallo('Para marcar como perdida hay que indicar el motivo de pérdida');
    if (resultado === 'GANADA' && op.valor_estimado != null && valorFinal == null) return fallo('Para marcar como ganada hay que indicar el valor final');

    let fechaCierreReal: string | null = null;
    if (resultado !== 'ABIERTA') {
        // Mediodía local para que la fecha elegida no se corra de día por zona horaria.
        const fecha = fechaCierre ? new Date(`${fechaCierre}T12:00:00`) : new Date();
        if (fecha.getTime() > Date.now() + 12 * 60 * 60 * 1000) return fallo('La fecha de cierre no puede ser futura');
        if (fechaCierre && fechaCierre < op.creado_en.slice(0, 10)) return fallo('La fecha de cierre no puede ser anterior al alta de la oportunidad');
        fechaCierreReal = fecha.toISOString();
    }

    const { error } = await supabase
        .from('oportunidades')
        .update({
            etapa_id: etapa.id,
            estado: resultado,
            fecha_cierre_real: fechaCierreReal,
            motivo_perdida_id: resultado === 'PERDIDA' ? motivoPerdidaId : null,
            valor_final: resultado === 'GANADA' ? valorFinal : null,
            nota_cambio_etapa: observacion,
            actualizado_por: usuario.id,
        })
        .eq('id', oportunidadId);

    if (error) {
        console.error('Error cambiando la etapa', error);
        return fallo(mensajeDeError(error));
    }

    revalidar(oportunidadId);
    return { ok: true, mensaje: 'Etapa actualizada correctamente' };
}

export async function reasignarResponsable(input: unknown): Promise<ActionResult> {
    const parsed = reasignarSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    const { oportunidadId, responsableId } = parsed.data;

    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');
    if (!puedeReasignar(usuario.rol)) return fallo('No tenés permiso para reasignar oportunidades');

    const supabase = await createClient();

    const op = await getOportunidadParaEditar(supabase, oportunidadId);
    if (!op) return fallo('Oportunidad no encontrada');
    if (op.estado !== 'ABIERTA') return fallo('La oportunidad está cerrada y no puede reasignarse');
    if (op.responsable_id === responsableId) return fallo('La oportunidad ya está asignada a ese responsable');

    const { data: destino } = await supabase.from('usuarios').select('id').eq('id', responsableId).eq('activo', true).maybeSingle();
    if (!destino) return fallo('El responsable elegido no existe o está inactivo');

    const { error } = await supabase.from('oportunidades').update({ responsable_id: responsableId, actualizado_por: usuario.id }).eq('id', oportunidadId);

    if (error) {
        console.error('Error reasignando la oportunidad', error);
        return fallo(mensajeDeError(error));
    }

    revalidar(oportunidadId);
    return { ok: true, mensaje: 'Responsable reasignado correctamente' };
}

export async function darDeBajaOportunidad(id: string): Promise<ActionResult> {
    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');

    const supabase = await createClient();

    const { error, count } = await supabase
        .from('oportunidades')
        .update({ activo: false, actualizado_por: usuario.id }, { count: 'exact' })
        .eq('id', id)
        .eq('activo', true);

    if (error) {
        console.error('Error dando de baja la oportunidad', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('Oportunidad no encontrada');

    revalidar(id);
    return { ok: true, mensaje: 'Oportunidad dada de baja' };
}
