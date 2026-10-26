'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server';
import { getUsuarioActual } from '../auth/session';
import { actividadSchema, vinculoSchema } from './schema';
import { getActividades, getTiposActividadActivos } from './queries';
import type { PanelActividadesData } from './types';
import type { ActionResult } from '../types';

const fallo = (mensaje: string): ActionResult<never> => ({ ok: false, error: true, mensaje });

function mensajeDeError(error: { code?: string; message: string }): string {
    switch (error.code) {
        case '42501':
            return 'No tenés permiso para registrar actividades en este registro';
        case '23503':
            return 'Alguno de los datos relacionados no existe';
        case '23514':
            return 'Los datos no cumplen una regla del dominio';
        default:
            return error.message;
    }
}

function revalidar() {
    revalidatePath('/oportunidades', 'layout');
    revalidatePath('/contactos', 'layout');
    revalidatePath('/inmuebles', 'layout');
}

export async function cargarPanelActividades(vinculo: unknown): Promise<ActionResult<PanelActividadesData>> {
    const parsed = vinculoSchema.safeParse(vinculo);
    if (!parsed.success) return fallo('Registro inválido');

    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');

    const verBajas = usuario.rol === 'ADMINISTRADOR' || usuario.rol === 'RESPONSABLE_COMERCIAL';
    try {
        const [actividades, tipos] = await Promise.all([
            getActividades(parsed.data, { incluirBajas: verBajas, usuarioId: usuario.id, esAdmin: usuario.rol === 'ADMINISTRADOR' }),
            getTiposActividadActivos(),
        ]);
        return { ok: true, data: { actividades, tipos, verBajas } };
    } catch (err) {
        console.error('Error cargando las actividades', err);
        return fallo('No pudimos cargar las actividades');
    }
}

export async function registrarActividad(input: unknown): Promise<ActionResult<{ id: string }>> {
    const parsed = actividadSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    const { vinculo, tipoId, titulo, descripcion, fecha } = parsed.data;

    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');

    const supabase = await createClient();

    const { data: tipo } = await supabase.from('tipos_actividad').select('nombre').eq('id', tipoId).eq('activo', true).is('clave', null).maybeSingle();
    if (!tipo) return fallo('El tipo de actividad no existe o está desactivado');

    const { data: creada, error } = await supabase
        .from('actividades')
        .insert({
            tipo_id: tipoId,
            titulo: titulo ?? tipo.nombre,
            descripcion,
            fecha,
            usuario_id: usuario.id,
            contacto_id: vinculo.tipo === 'contacto' ? vinculo.id : null,
            inmueble_id: vinculo.tipo === 'inmueble' ? vinculo.id : null,
            oportunidad_id: vinculo.tipo === 'oportunidad' ? vinculo.id : null,
        })
        .select('id')
        .single();

    if (error || !creada) {
        console.error('Error registrando la actividad', error);
        return fallo(error ? mensajeDeError(error) : 'No se pudo registrar la actividad');
    }

    revalidar();
    return { ok: true, mensaje: 'Actividad registrada', data: { id: creada.id } };
}

export async function darDeBajaActividad(id: string): Promise<ActionResult> {
    if (!vinculoSchema.shape.id.safeParse(id).success) return fallo('Identificador inválido');

    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');

    const supabase = await createClient();
    const { error, count } = await supabase.from('actividades').update({ activo: false }, { count: 'exact' }).eq('id', id).eq('activo', true);

    if (error) {
        console.error('Error dando de baja la actividad', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('Solo podés dar de baja las actividades que registraste vos');

    revalidar();
    return { ok: true, mensaje: 'Actividad dada de baja' };
}
