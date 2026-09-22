'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server';
import { getUsuarioActual } from '../auth/session';
import { inmuebleSchema } from './schema';
import type { InmuebleSchemaOutput } from './schema';
import type { ActionResult } from '../types';

type Supabase = Awaited<ReturnType<typeof createClient>>;

function revalidar(id?: string) {
    revalidatePath('/inmuebles');
    if (id) revalidatePath(`/inmuebles/${id}`);
    revalidatePath('/oportunidades');
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

async function validarPropietario(supabase: Supabase, contactoId: string): Promise<string | null> {
    const { data, error } = await supabase.from('contactos').select('id, es_propietario, activo').eq('id', contactoId).maybeSingle();
    if (error) {
        console.error('Error leyendo el contacto propietario', error);
        return 'No se pudo verificar el propietario';
    }
    if (!data) return 'El contacto propietario no existe';
    if (!data.activo) return 'El contacto propietario está dado de baja';
    if (!data.es_propietario) return 'El contacto elegido no está marcado como propietario';
    return null;
}

function aColumnas(data: InmuebleSchemaOutput) {
    return {
        contacto_id: data.contactoId,
        nombre: data.nombre,
        direccion: data.direccion,
        localidad: data.localidad,
        tipo_operacion: data.tipoOperacion,
        tipo_inmueble: data.tipoInmueble,
        estado: data.estado,
        ambientes: data.ambientes,
        dormitorios: data.dormitorios,
        banos: data.banos,
        m2: data.m2,
        cochera: data.cochera,
        antiguedad: data.antiguedad,
        precio: data.precio,
        moneda: data.moneda,
        expensas: data.expensas,
        descripcion: data.descripcion,
    };
}

export async function crearInmueble(input: unknown): Promise<ActionResult<{ id: string }>> {
    const parsed = inmuebleSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    const data = parsed.data;

    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');

    const supabase = await createClient();

    const errorPropietario = await validarPropietario(supabase, data.contactoId);
    if (errorPropietario) return fallo(errorPropietario);

    const { data: creado, error } = await supabase
        .from('inmuebles')
        .insert({ ...aColumnas(data), creado_por: usuario.id, actualizado_por: usuario.id })
        .select('id')
        .single();

    if (error || !creado) {
        console.error('Error creando el inmueble', error);
        return fallo(error ? mensajeDeError(error) : 'No se pudo crear el inmueble');
    }

    revalidar(creado.id);
    return { ok: true, mensaje: 'Inmueble creado correctamente', data: { id: creado.id } };
}

export async function actualizarInmueble(id: string, input: unknown): Promise<ActionResult> {
    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');

    const parsed = inmuebleSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    const data = parsed.data;

    const supabase = await createClient();

    const errorPropietario = await validarPropietario(supabase, data.contactoId);
    if (errorPropietario) return fallo(errorPropietario);

    const { error, count } = await supabase
        .from('inmuebles')
        .update({ ...aColumnas(data), actualizado_por: usuario.id }, { count: 'exact' })
        .eq('id', id)
        .eq('activo', true);

    if (error) {
        console.error('Error actualizando el inmueble', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('Inmueble no encontrado');

    revalidar(id);
    return { ok: true, mensaje: 'Inmueble actualizado correctamente' };
}

export async function darDeBajaInmueble(id: string): Promise<ActionResult> {
    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');

    const supabase = await createClient();

    // RF7: no se retira de la cartera algo que todavía se está negociando.
    const { count: abiertas, error: errorOportunidades } = await supabase
        .from('oportunidades')
        .select('id', { count: 'exact', head: true })
        .eq('inmueble_id', id)
        .eq('activo', true)
        .eq('estado', 'ABIERTA');

    if (errorOportunidades) {
        console.error('Error contando oportunidades del inmueble', errorOportunidades);
        return fallo('No se pudo verificar las oportunidades del inmueble');
    }
    if (abiertas && abiertas > 0) {
        const detalle = abiertas === 1 ? '1 oportunidad abierta: cerrala' : `${abiertas} oportunidades abiertas: cerralas`;
        return fallo(`El inmueble tiene ${detalle} antes de darlo de baja`);
    }

    const { error, count } = await supabase
        .from('inmuebles')
        .update({ activo: false, actualizado_por: usuario.id }, { count: 'exact' })
        .eq('id', id)
        .eq('activo', true);

    if (error) {
        console.error('Error dando de baja el inmueble', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('Inmueble no encontrado');

    revalidar(id);
    return { ok: true, mensaje: 'Inmueble dado de baja' };
}
