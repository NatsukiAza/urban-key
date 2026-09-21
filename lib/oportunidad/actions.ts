'use server';
import { revalidatePath } from 'next/cache';
import { db } from '../mock/store';
import { uid } from '../mock/ids';
import { getUsuarioActual } from '../auth/session';
import { oportunidadSchema, cambiarEtapaSchema } from './schema';
import type { ActionResult } from '../types';
import type { Oportunidad } from './types';
import type { Etapa } from '../dominio';
import type { EstadoOportunidad } from '../enums/estadoOportunidad';

function revalidar(id?: string) {
    revalidatePath('/oportunidades');
    revalidatePath('/oportunidades/tablero');
    if (id) revalidatePath(`/oportunidades/${id}`);
}

// Aplica un cambio de etapa sobre la oportunidad (muta el store) validando las reglas de dominio.
// Devuelve un mensaje de error si alguna regla falla, o null si se aplicó bien.
function aplicarCambioEtapa(op: Oportunidad, nuevaEtapa: Etapa, usuarioId: string, observacion: string | null, motivoPerdidaId: string | null): string | null {
    // Regla: la etapa debe pertenecer al funnel de la oportunidad.
    if (nuevaEtapa.funnelId !== op.funnelId) return 'La etapa no pertenece al funnel de la oportunidad';

    const resultado: EstadoOportunidad = nuevaEtapa.resultado;

    // Regla: perdida exige motivo.
    if (resultado === 'PERDIDA' && !motivoPerdidaId) return 'Para marcar como perdida hay que indicar el motivo de pérdida';

    const etapaAnteriorId = op.etapaId;
    op.etapaId = nuevaEtapa.id;
    op.estado = resultado;
    op.fechaCierreReal = resultado === 'ABIERTA' ? null : new Date().toISOString();
    op.motivoPerdidaId = resultado === 'PERDIDA' ? motivoPerdidaId : null;
    op.actualizadoEn = new Date().toISOString();
    op.actualizadoPor = usuarioId;

    // Regla: cada cambio de etapa se conserva como registro independiente.
    if (etapaAnteriorId !== nuevaEtapa.id) {
        db.historialEtapas.push({
            id: uid(),
            oportunidadId: op.id,
            etapaAnteriorId,
            etapaNuevaId: nuevaEtapa.id,
            usuarioId,
            creadoEn: new Date().toISOString(),
            observacion,
        });
    }
    return null;
}

export async function crearOportunidad(input: unknown): Promise<ActionResult<{ id: string }>> {
    const parsed = oportunidadSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false, error: true, mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }
    const data = parsed.data;
    const usuario = await getUsuarioActual();

    const etapa = db.etapas.find((e) => e.id === data.etapaId);
    if (!etapa) return { ok: false, error: true, mensaje: 'La etapa no existe' };
    if (etapa.funnelId !== data.funnelId) return { ok: false, error: true, mensaje: 'La etapa no pertenece al funnel elegido' };
    // Regla: una oportunidad nueva inicia en una etapa abierta.
    if (etapa.resultado !== 'ABIERTA') return { ok: false, error: true, mensaje: 'Una oportunidad nueva debe iniciar en una etapa abierta' };

    const now = new Date().toISOString();
    const op: Oportunidad = {
        id: uid(),
        titulo: data.titulo,
        contactoId: data.contactoId,
        inmuebleId: data.inmuebleId ?? null,
        responsableId: data.responsableId,
        funnelId: data.funnelId,
        etapaId: data.etapaId,
        estado: 'ABIERTA',
        valorEstimado: data.valorEstimado ?? null,
        origenId: data.origenId ?? null,
        observaciones: data.observaciones ?? null,
        motivoPerdidaId: null,
        fechaCierreReal: null,
        activo: true,
        creadoEn: now,
        actualizadoEn: now,
        creadoPor: usuario?.id ?? '',
        actualizadoPor: usuario?.id ?? '',
    };
    db.oportunidades.push(op);
    revalidar(op.id);
    return { ok: true, mensaje: 'Oportunidad creada correctamente', data: { id: op.id } };
}

export async function actualizarOportunidad(id: string, input: unknown): Promise<ActionResult> {
    const op = db.oportunidades.find((x) => x.id === id && x.activo);
    if (!op) return { ok: false, error: true, mensaje: 'Oportunidad no encontrada' };
    // Regla: una oportunidad cerrada no se modifica sin autorización.
    if (op.estado !== 'ABIERTA') return { ok: false, error: true, mensaje: 'La oportunidad está cerrada y no puede modificarse' };

    const parsed = oportunidadSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: true, mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    const data = parsed.data;
    const usuario = await getUsuarioActual();

    const etapa = db.etapas.find((e) => e.id === data.etapaId);
    if (!etapa) return { ok: false, error: true, mensaje: 'La etapa no existe' };
    if (etapa.funnelId !== data.funnelId) return { ok: false, error: true, mensaje: 'La etapa no pertenece al funnel elegido' };
    // Desde el formulario de edición no se cierra la oportunidad: para ganar/perder se usa el tablero.
    if (etapa.resultado !== 'ABIERTA') return { ok: false, error: true, mensaje: 'Para ganar o perder la oportunidad usá el tablero (cambio de etapa)' };

    op.titulo = data.titulo;
    op.contactoId = data.contactoId;
    op.inmuebleId = data.inmuebleId ?? null;
    op.responsableId = data.responsableId;
    op.funnelId = data.funnelId;
    op.valorEstimado = data.valorEstimado ?? null;
    op.origenId = data.origenId ?? null;
    op.observaciones = data.observaciones ?? null;
    op.actualizadoEn = new Date().toISOString();
    op.actualizadoPor = usuario?.id ?? '';

    // Si cambió la etapa (dentro de las abiertas), se registra en el historial.
    if (op.etapaId !== etapa.id) {
        aplicarCambioEtapa(op, etapa, usuario?.id ?? '', 'Cambio desde edición', null);
    }

    revalidar(id);
    return { ok: true, mensaje: 'Oportunidad actualizada correctamente' };
}

export async function cambiarEtapa(input: unknown): Promise<ActionResult> {
    const parsed = cambiarEtapaSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: true, mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    const { oportunidadId, etapaId, observacion, motivoPerdidaId } = parsed.data;

    const op = db.oportunidades.find((x) => x.id === oportunidadId && x.activo);
    if (!op) return { ok: false, error: true, mensaje: 'Oportunidad no encontrada' };
    // Regla: una oportunidad cerrada no se reabre/modifica sin autorización.
    if (op.estado !== 'ABIERTA') return { ok: false, error: true, mensaje: 'La oportunidad está cerrada y no puede cambiar de etapa' };

    const etapa = db.etapas.find((e) => e.id === etapaId);
    if (!etapa) return { ok: false, error: true, mensaje: 'La etapa no existe' };

    const usuario = await getUsuarioActual();
    const err = aplicarCambioEtapa(op, etapa, usuario?.id ?? '', observacion, motivoPerdidaId);
    if (err) return { ok: false, error: true, mensaje: err };

    revalidar(oportunidadId);
    return { ok: true, mensaje: 'Etapa actualizada correctamente' };
}

export async function darDeBajaOportunidad(id: string): Promise<ActionResult> {
    const op = db.oportunidades.find((x) => x.id === id);
    if (!op) return { ok: false, error: true, mensaje: 'Oportunidad no encontrada' };
    op.activo = false; // baja lógica
    op.actualizadoEn = new Date().toISOString();
    revalidar(id);
    return { ok: true, mensaje: 'Oportunidad dada de baja' };
}
