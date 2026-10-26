'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '../supabase/server';
import { getUsuarioActual } from '../auth/session';
import { nombreConfigSchema, nuevaEtapaSchema, reordenarEtapasSchema } from './schema';
import type { ActionResult } from '../types';

type Supabase = Awaited<ReturnType<typeof createClient>>;

const fallo = (mensaje: string): ActionResult<never> => ({ ok: false, error: true, mensaje });

const uuid = z.uuid('Identificador inválido');

function mensajeDeError(error: { code?: string; message: string }): string {
    switch (error.code) {
        case '42501':
            return 'No tenés permiso para realizar esta operación';
        case '23505':
            return 'Ya existe un registro con ese nombre';
        default:
            return error.message;
    }
}

async function exigirAdmin() {
    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');
    if (usuario.rol !== 'ADMINISTRADOR') return fallo('Solo un administrador puede modificar la configuración');
    return null;
}

function revalidarEmbudos() {
    revalidatePath('/configuracion/embudos');
    revalidatePath('/oportunidades', 'layout');
}

async function getEtapasDelFunnel(supabase: Supabase, funnelId: string) {
    const { data, error } = await supabase.from('etapas').select('id, orden, resultado').eq('funnel_id', funnelId).order('orden');
    if (error) console.error('Error leyendo las etapas del funnel', error);
    return data ?? null;
}

// ---------------------------------------------------------------------------
// Etapas
// ---------------------------------------------------------------------------

export async function crearEtapa(input: unknown): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;

    const parsed = nuevaEtapaSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    const { funnelId, nombre } = parsed.data;

    const supabase = await createClient();
    const etapas = await getEtapasDelFunnel(supabase, funnelId);
    if (!etapas) return fallo('No se pudieron leer las etapas del funnel');

    // La nueva etapa va después de la última abierta; las de cierre se corren un lugar.
    const abiertas = etapas.filter((e) => e.resultado === 'ABIERTA');
    const orden = (abiertas.at(-1)?.orden ?? 0) + 1;
    const aCorrer = etapas.filter((e) => e.resultado !== 'ABIERTA' && e.orden >= orden).reverse();
    for (const e of aCorrer) {
        const { error } = await supabase.from('etapas').update({ orden: e.orden + 1 }).eq('id', e.id);
        if (error) {
            console.error('Error corriendo las etapas de cierre', error);
            return fallo(mensajeDeError(error));
        }
    }

    const { error } = await supabase.from('etapas').insert({ funnel_id: funnelId, nombre, orden, resultado: 'ABIERTA', es_final: false });
    if (error) {
        console.error('Error creando la etapa', error);
        return fallo(mensajeDeError(error));
    }

    revalidarEmbudos();
    return { ok: true, mensaje: 'Etapa creada correctamente' };
}

export async function renombrarEtapa(id: string, nombre: unknown): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;
    if (!uuid.safeParse(id).success) return fallo('Identificador inválido');

    const parsed = nombreConfigSchema.safeParse(nombre);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Nombre inválido');

    const supabase = await createClient();
    const { error, count } = await supabase.from('etapas').update({ nombre: parsed.data }, { count: 'exact' }).eq('id', id);
    if (error) {
        console.error('Error renombrando la etapa', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('Etapa no encontrada');

    revalidarEmbudos();
    return { ok: true, mensaje: 'Etapa renombrada' };
}

export async function cambiarActivoEtapa(id: string, activo: boolean): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;
    if (!uuid.safeParse(id).success) return fallo('Identificador inválido');

    const supabase = await createClient();
    const { data: etapa, error: errorEtapa } = await supabase.from('etapas').select('id, resultado').eq('id', id).maybeSingle();
    if (errorEtapa || !etapa) return fallo('Etapa no encontrada');

    if (!activo) {
        if (etapa.resultado !== 'ABIERTA') return fallo('Las etapas de cierre (ganada/perdida) no se pueden desactivar');
        const { count, error } = await supabase.from('oportunidades').select('id', { count: 'exact', head: true }).eq('etapa_id', id).eq('estado', 'ABIERTA').eq('activo', true);
        if (error) return fallo('No se pudo verificar si la etapa tiene oportunidades');
        if ((count ?? 0) > 0) return fallo(`La etapa tiene ${count} oportunidad(es) abierta(s); movelas antes de desactivarla`);
    }

    const { error } = await supabase.from('etapas').update({ activo }).eq('id', id);
    if (error) {
        console.error('Error cambiando el estado de la etapa', error);
        return fallo(mensajeDeError(error));
    }

    revalidarEmbudos();
    return { ok: true, mensaje: activo ? 'Etapa activada' : 'Etapa desactivada' };
}

export async function reordenarEtapas(input: unknown): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;

    const parsed = reordenarEtapasSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    const { funnelId, etapaIds } = parsed.data;

    // La función valida que estén exactamente las etapas abiertas del funnel y reordena todo en una transacción.
    const supabase = await createClient();
    const { error } = await supabase.rpc('reordenar_etapas', { p_funnel_id: funnelId, p_etapa_ids: etapaIds });
    if (error) {
        console.error('Error reordenando las etapas', error);
        return fallo(mensajeDeError(error));
    }

    revalidarEmbudos();
    return { ok: true, mensaje: 'Orden actualizado' };
}

// ---------------------------------------------------------------------------
// Motivos de pérdida
// ---------------------------------------------------------------------------

function revalidarMotivos() {
    revalidatePath('/configuracion/motivos-perdida');
    revalidatePath('/oportunidades', 'layout');
}

export async function crearMotivoPerdida(nombre: unknown): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;

    const parsed = nombreConfigSchema.safeParse(nombre);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Nombre inválido');

    const supabase = await createClient();
    const { error } = await supabase.from('motivos_perdida').insert({ nombre: parsed.data });
    if (error) {
        console.error('Error creando el motivo de pérdida', error);
        return fallo(mensajeDeError(error));
    }

    revalidarMotivos();
    return { ok: true, mensaje: 'Motivo creado correctamente' };
}

export async function renombrarMotivoPerdida(id: string, nombre: unknown): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;
    if (!uuid.safeParse(id).success) return fallo('Identificador inválido');

    const parsed = nombreConfigSchema.safeParse(nombre);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Nombre inválido');

    const supabase = await createClient();
    const { error, count } = await supabase.from('motivos_perdida').update({ nombre: parsed.data }, { count: 'exact' }).eq('id', id);
    if (error) {
        console.error('Error renombrando el motivo de pérdida', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('Motivo no encontrado');

    revalidarMotivos();
    return { ok: true, mensaje: 'Motivo renombrado' };
}

export async function cambiarActivoMotivoPerdida(id: string, activo: boolean): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;
    if (!uuid.safeParse(id).success) return fallo('Identificador inválido');

    const supabase = await createClient();
    const { error, count } = await supabase.from('motivos_perdida').update({ activo }, { count: 'exact' }).eq('id', id);
    if (error) {
        console.error('Error cambiando el estado del motivo', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('Motivo no encontrado');

    revalidarMotivos();
    return { ok: true, mensaje: activo ? 'Motivo activado' : 'Motivo desactivado' };
}

type TablaCatalogo = 'origenes' | 'tipos_actividad';

const CATALOGOS: Record<TablaCatalogo, { singular: string; rutas: [string, 'layout' | 'page'][] }> = {
    origenes: {
        singular: 'Origen',
        rutas: [
            ['/configuracion/origenes', 'page'],
            ['/oportunidades', 'layout'],
        ],
    },
    tipos_actividad: {
        singular: 'Tipo de actividad',
        rutas: [
            ['/configuracion/tipos-actividad', 'page'],
            ['/', 'layout'],
        ],
    },
};

function revalidarCatalogo(tabla: TablaCatalogo) {
    for (const [ruta, tipo] of CATALOGOS[tabla].rutas) revalidatePath(ruta, tipo);
}

async function crearEnCatalogo(tabla: TablaCatalogo, nombre: unknown): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;

    const parsed = nombreConfigSchema.safeParse(nombre);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Nombre inválido');

    const supabase = await createClient();
    const { error } = await supabase.from(tabla).insert({ nombre: parsed.data });
    if (error) {
        console.error(`Error creando en ${tabla}`, error);
        return fallo(mensajeDeError(error));
    }

    revalidarCatalogo(tabla);
    return { ok: true, mensaje: `${CATALOGOS[tabla].singular} creado correctamente` };
}

async function renombrarEnCatalogo(tabla: TablaCatalogo, id: string, nombre: unknown): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;
    if (!uuid.safeParse(id).success) return fallo('Identificador inválido');

    const parsed = nombreConfigSchema.safeParse(nombre);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Nombre inválido');

    const supabase = await createClient();
    const { error, count } = await supabase.from(tabla).update({ nombre: parsed.data }, { count: 'exact' }).eq('id', id);
    if (error) {
        console.error(`Error renombrando en ${tabla}`, error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo(`${CATALOGOS[tabla].singular} no encontrado`);

    revalidarCatalogo(tabla);
    return { ok: true, mensaje: `${CATALOGOS[tabla].singular} renombrado` };
}

async function cambiarActivoEnCatalogo(tabla: TablaCatalogo, id: string, activo: boolean): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;
    if (!uuid.safeParse(id).success) return fallo('Identificador inválido');

    const supabase = await createClient();
    if (tabla === 'tipos_actividad' && !activo) {
        const { data } = await supabase.from('tipos_actividad').select('clave').eq('id', id).maybeSingle();
        if (data?.clave) return fallo('Este tipo lo usa el sistema y no se puede desactivar');
    }

    const { error, count } = await supabase.from(tabla).update({ activo }, { count: 'exact' }).eq('id', id);
    if (error) {
        console.error(`Error cambiando el estado en ${tabla}`, error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo(`${CATALOGOS[tabla].singular} no encontrado`);

    revalidarCatalogo(tabla);
    return { ok: true, mensaje: `${CATALOGOS[tabla].singular} ${activo ? 'activado' : 'desactivado'}` };
}

export async function crearOrigen(nombre: unknown): Promise<ActionResult> {
    return crearEnCatalogo('origenes', nombre);
}

export async function renombrarOrigen(id: string, nombre: unknown): Promise<ActionResult> {
    return renombrarEnCatalogo('origenes', id, nombre);
}

export async function cambiarActivoOrigen(id: string, activo: boolean): Promise<ActionResult> {
    return cambiarActivoEnCatalogo('origenes', id, activo);
}

export async function crearTipoActividad(nombre: unknown): Promise<ActionResult> {
    return crearEnCatalogo('tipos_actividad', nombre);
}

export async function renombrarTipoActividad(id: string, nombre: unknown): Promise<ActionResult> {
    return renombrarEnCatalogo('tipos_actividad', id, nombre);
}

export async function cambiarActivoTipoActividad(id: string, activo: boolean): Promise<ActionResult> {
    return cambiarActivoEnCatalogo('tipos_actividad', id, activo);
}
