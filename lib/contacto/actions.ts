'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '../supabase/server';
import { LIMITES_CONTACTO } from './fila';
import { getUsuarioActual } from '../auth/session';
import { puedeReasignar } from '../auth/permisos';
import { CONTACTO_COLUMNS, CONTACTO_COLUMNS_BASE, faltaColumnaNueva, mapContacto } from './fila';
import type { Contacto, ContactoInput } from '../supabase/contactos';
import type { ActionResult } from '../types';

const ESTADOS_CONTACTO = ['POTENCIAL', 'CLIENTE', 'INACTIVO', 'NO_CONTACTAR'] as const;

const uuid = z.uuid('Identificador inválido');

const contactoSchema = z
    .object({
        nombre: z.string().trim().min(1, 'Cargá el nombre.').max(LIMITES_CONTACTO.nombre, `El nombre puede tener hasta ${LIMITES_CONTACTO.nombre} caracteres.`),
        apellido: z.string().trim().min(1, 'Cargá el apellido.').max(LIMITES_CONTACTO.apellido, `El apellido puede tener hasta ${LIMITES_CONTACTO.apellido} caracteres.`),
        email: z.string().trim().max(LIMITES_CONTACTO.email, `El email puede tener hasta ${LIMITES_CONTACTO.email} caracteres.`).default(''),
        telefono: z
            .string()
            .trim()
            .max(LIMITES_CONTACTO.telefono, `El teléfono puede tener hasta ${LIMITES_CONTACTO.telefono} caracteres.`)
            .regex(/^[\d\s-]*$/, 'El teléfono solo puede tener números, espacios y guiones.')
            .default(''),
        estado: z.enum(ESTADOS_CONTACTO),
        es_propietario: z.boolean(),
        es_interesado: z.boolean(),
        observaciones: z.string().trim().default(''),
        origen_id: z
            .string()
            .trim()
            .default('')
            .refine((v) => v === '' || z.uuid().safeParse(v).success, 'Elegí un origen de la lista.'),
        responsable_id: z
            .string()
            .trim()
            .default('')
            .refine((v) => v === '' || z.uuid().safeParse(v).success, 'Elegí un responsable de la lista.'),
    })
    .refine((d) => Boolean(d.email || d.telefono), {
        message: 'Cargá al menos un teléfono o un email.',
    })
    .refine((d) => d.es_propietario || d.es_interesado, {
        message: 'Elegí al menos un rol (propietario o interesado).',
    });

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

function revalidar(id?: string) {
    revalidatePath('/contactos');
    if (id) revalidatePath(`/contactos/${id}`);
    revalidatePath('/oportunidades');
    revalidatePath('/inmuebles');
}

export async function crearContactoAction(input: ContactoInput): Promise<ActionResult<{ contacto: Contacto }>> {
    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa.');

    const parsed = contactoSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos.');
    const d = parsed.data;

    const supabase = await createClient();
    if (d.origen_id) {
        const { data: origen } = await supabase.from('origenes').select('id').eq('id', d.origen_id).eq('activo', true).maybeSingle();
        if (!origen) return fallo('El origen no existe o está desactivado.');
    }

    const responsableId = puedeReasignar(usuario.rol) && d.responsable_id ? d.responsable_id : usuario.id;
    if (responsableId !== usuario.id) {
        const { data: responsable } = await supabase.from('usuarios').select('id').eq('id', responsableId).eq('activo', true).maybeSingle();
        if (!responsable) return fallo('El responsable no existe o está inactivo.');
    }

    const filaNueva = {
        nombre: d.nombre,
        apellido: d.apellido,
        email: d.email || null,
        telefono: d.telefono || null,
        estado: d.estado,
        es_propietario: d.es_propietario,
        es_interesado: d.es_interesado,
        observaciones: d.observaciones || null,
        creado_por: usuario.id,
        actualizado_por: usuario.id,
        activo: true,
    };
    let { data, error } = await supabase
        .from('contactos')
        .insert({ ...filaNueva, origen_id: d.origen_id || null, responsable_id: responsableId })
        .select(CONTACTO_COLUMNS)
        .single();

    if (faltaColumnaNueva(error)) {
        const retry = await supabase.from('contactos').insert(filaNueva as never).select(CONTACTO_COLUMNS_BASE).single();
        data = retry.data ? { ...retry.data, origen_id: null, responsable_id: responsableId } : null;
        error = retry.error;
    }

    if (error || !data) {
        console.error('Error creando el contacto', error);
        return fallo(error ? mensajeDeError(error) : 'No se pudo guardar el contacto.');
    }

    revalidar(data.id);
    return { ok: true, mensaje: 'Contacto creado correctamente', data: { contacto: mapContacto(data) } };
}

export async function actualizarContactoAction(id: string, input: ContactoInput): Promise<ActionResult<{ contacto: Contacto }>> {
    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa.');
    if (!uuid.safeParse(id).success) return fallo('Identificador inválido.');

    const parsed = contactoSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos.');
    const d = parsed.data;

    const supabase = await createClient();
    if (d.origen_id) {
        const { data: origen } = await supabase.from('origenes').select('id').eq('id', d.origen_id).eq('activo', true).maybeSingle();
        if (!origen) return fallo('El origen no existe o está desactivado.');
    }

    const cambios = {
        nombre: d.nombre,
        apellido: d.apellido,
        email: d.email || null,
        telefono: d.telefono || null,
        estado: d.estado,
        es_propietario: d.es_propietario,
        es_interesado: d.es_interesado,
        observaciones: d.observaciones || null,
        actualizado_por: usuario.id,
    };
    let { data, error } = await supabase
        .from('contactos')
        .update({ ...cambios, origen_id: d.origen_id || null })
        .eq('id', id)
        .eq('activo', true)
        .select(CONTACTO_COLUMNS)
        .single();

    if (faltaColumnaNueva(error)) {
        const retry = await supabase.from('contactos').update(cambios).eq('id', id).eq('activo', true).select(CONTACTO_COLUMNS_BASE).single();
        data = retry.data ? { ...retry.data, origen_id: null, responsable_id: usuario.id } : null;
        error = retry.error;
    }

    if (error || !data) {
        console.error('Error actualizando el contacto', error);
        return fallo(error ? mensajeDeError(error) : 'No se pudieron guardar los cambios.');
    }

    revalidar(id);
    return { ok: true, mensaje: 'Contacto actualizado correctamente', data: { contacto: mapContacto(data) } };
}

export async function reasignarContactoAction(id: string, responsableId: string): Promise<ActionResult> {
    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa.');
    if (!puedeReasignar(usuario.rol)) return fallo('No tenés permiso para reasignar contactos.');
    if (!uuid.safeParse(id).success || !uuid.safeParse(responsableId).success) return fallo('Identificador inválido.');

    const supabase = await createClient();
    const { data: responsable } = await supabase.from('usuarios').select('id').eq('id', responsableId).eq('activo', true).maybeSingle();
    if (!responsable) return fallo('El responsable no existe o está inactivo.');

    const { error, count } = await supabase
        .from('contactos')
        .update({ responsable_id: responsableId, actualizado_por: usuario.id }, { count: 'exact' })
        .eq('id', id)
        .eq('activo', true);

    if (error) {
        console.error('Error reasignando el contacto', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('Contacto no encontrado.');

    revalidar(id);
    return { ok: true, mensaje: 'Contacto reasignado' };
}

export async function darDeBajaContactoAction(id: string): Promise<ActionResult> {
    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa.');
    if (!uuid.safeParse(id).success) return fallo('Identificador inválido.');

    const supabase = await createClient();

    const { count: abiertas, error: errorOps } = await supabase
        .from('oportunidades')
        .select('id', { count: 'exact', head: true })
        .eq('contacto_id', id)
        .eq('activo', true)
        .eq('estado', 'ABIERTA');

    if (errorOps) {
        console.error('Error verificando oportunidades del contacto', errorOps);
        return fallo('No se pudo verificar las oportunidades del contacto.');
    }
    if ((abiertas ?? 0) > 0) {
        const detalle = abiertas === 1 ? '1 oportunidad abierta: cerrala' : `${abiertas} oportunidades abiertas: cerralas`;
        return fallo(`El contacto tiene ${detalle} antes de darlo de baja.`);
    }

    const { error, count } = await supabase
        .from('contactos')
        .update({ activo: false, estado: 'INACTIVO', actualizado_por: usuario.id }, { count: 'exact' })
        .eq('id', id)
        .eq('activo', true);

    if (error) {
        console.error('Error dando de baja el contacto', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('Contacto no encontrado.');

    revalidar(id);
    return { ok: true, mensaje: 'Contacto dado de baja' };
}

export async function agregarObservacionAction(contactoId: string, texto: string): Promise<ActionResult> {
    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa.');
    if (!uuid.safeParse(contactoId).success) return fallo('Identificador inválido.');

    const limpio = texto.trim();
    if (!limpio) return fallo('Escribí la observación antes de guardarla.');

    const supabase = await createClient();
    const { data: tipo } = await supabase.from('tipos_actividad').select('id').eq('clave', 'OBSERVACION').maybeSingle();
    if (!tipo) return fallo('No se encontró el tipo de actividad para observaciones.');

    const { error } = await supabase.from('actividades').insert({
        contacto_id: contactoId,
        usuario_id: usuario.id,
        tipo_id: tipo.id,
        titulo: 'Observación',
        descripcion: limpio,
        resultado: limpio,
        fecha: new Date().toISOString(),
    });

    if (error) {
        console.error('Error agregando observación al contacto', error);
        return fallo(mensajeDeError(error));
    }

    revalidar(contactoId);
    return { ok: true, mensaje: 'Observación agregada' };
}
