import type { SupabaseClient } from '@supabase/supabase-js';

export type EstadoContacto = 'POTENCIAL' | 'CLIENTE' | 'INACTIVO' | 'NO_CONTACTAR';

export const ESTADOS_CONTACTO: EstadoContacto[] = ['POTENCIAL', 'CLIENTE', 'INACTIVO', 'NO_CONTACTAR'];

export const estadoLabel: Record<EstadoContacto, string> = {
    POTENCIAL: 'Potencial',
    CLIENTE: 'Cliente',
    INACTIVO: 'Inactivo',
    NO_CONTACTAR: 'No contactar',
};

export const estadoContactoConfig: Record<EstadoContacto, { label: string; color: string }> = {
    POTENCIAL: { label: 'Potencial', color: 'warning' },
    CLIENTE: { label: 'Cliente', color: 'success' },
    INACTIVO: { label: 'Inactivo', color: 'dark' },
    NO_CONTACTAR: { label: 'No contactar', color: 'danger' },
};

export type Contacto = {
    id: string;
    nombre: string;
    apellido: string;
    email: string | null;
    telefono: string | null;
    estado: EstadoContacto;
    es_propietario: boolean;
    es_interesado: boolean;
    observaciones: string | null;
    sucursal_id: string | null;
    activo: boolean;
    creado_por: string | null;
};

export type Observacion = {
    id: string;
    descripcion: string | null;
    fecha: string;
    usuario_id: string | null;
    autor: string;
};

export type ContactoInput = {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    estado: EstadoContacto;
    es_propietario: boolean;
    es_interesado: boolean;
    observaciones: string;
};

const CONTACTO_COLUMNS = 'id, nombre, apellido, email, telefono, estado, es_propietario, es_interesado, observaciones, sucursal_id, activo, creado_por';

export function nombreContacto(contacto: Pick<Contacto, 'nombre' | 'apellido'>) {
    return `${contacto.nombre} ${contacto.apellido}`.trim();
}

function mensajeGuardado(error: { code?: string; message?: string }, accion: string) {
    if (error.code === '42501') {
        return `No se pudo ${accion}. El proyecto de Supabase no permite esa escritura.`;
    }
    return `No se pudo ${accion}.`;
}

export async function listarContactos(supabase: SupabaseClient): Promise<{ contactos: Contacto[] } | { error: string }> {
    const { data, error } = await supabase.from('contactos').select(CONTACTO_COLUMNS).order('apellido', { ascending: true }).order('nombre', { ascending: true });

    if (error) {
        return { error: 'No se pudieron leer los contactos.' };
    }

    return { contactos: data ?? [] };
}

export async function obtenerContacto(supabase: SupabaseClient, id: string): Promise<{ contacto: Contacto } | { error: string }> {
    const { data, error } = await supabase.from('contactos').select(CONTACTO_COLUMNS).eq('id', id).maybeSingle();

    if (error) {
        return { error: 'No se pudo leer el contacto.' };
    }
    if (!data) {
        return { error: 'No encontramos ese contacto.' };
    }

    return { contacto: data };
}

export async function crearContacto(supabase: SupabaseClient, input: ContactoInput): Promise<{ contacto: Contacto } | { error: string }> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No hay una sesión activa.' };
    }

    const { data, error } = await supabase
        .from('contactos')
        .insert({
            nombre: input.nombre.trim(),
            apellido: input.apellido.trim(),
            email: input.email.trim() || null,
            telefono: input.telefono.trim() || null,
            estado: input.estado,
            es_propietario: input.es_propietario,
            es_interesado: input.es_interesado,
            observaciones: input.observaciones.trim() || null,
            creado_por: user.id,
            activo: true,
        })
        .select(CONTACTO_COLUMNS)
        .single();

    if (error || !data) {
        return { error: mensajeGuardado(error ?? {}, 'guardar el contacto') };
    }

    return { contacto: data };
}

export async function actualizarEstadoContacto(supabase: SupabaseClient, id: string, estado: EstadoContacto): Promise<{ contacto: Contacto } | { error: string }> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('contactos')
        .update({
            estado,
            actualizado_por: user?.id ?? null,
        })
        .eq('id', id)
        .select(CONTACTO_COLUMNS)
        .single();

    if (error || !data) {
        return { error: mensajeGuardado(error ?? {}, 'actualizar el estado') };
    }

    return { contacto: data };
}

export async function listarObservaciones(supabase: SupabaseClient, contactoId: string): Promise<{ observaciones: Observacion[] } | { error: string }> {
    const { data, error } = await supabase
        .from('actividades')
        .select('id, descripcion, fecha, usuario_id')
        .eq('contacto_id', contactoId)
        .eq('tipo', 'MENSAJE')
        .order('fecha', { ascending: false });

    if (error) {
        return { error: 'No se pudieron leer las observaciones.' };
    }

    const filas = data ?? [];
    const ids = [...new Set(filas.map((fila) => fila.usuario_id).filter((id): id is string => Boolean(id)))];
    const nombres = new Map<string, string>();

    if (ids.length > 0) {
        const { data: usuarios } = await supabase.from('usuarios').select('id, nombre, apellido').in('id', ids);
        for (const usuario of usuarios ?? []) {
            nombres.set(usuario.id, `${usuario.nombre} ${usuario.apellido}`.trim());
        }
    }

    return {
        observaciones: filas.map((fila) => ({
            id: fila.id,
            descripcion: fila.descripcion,
            fecha: fila.fecha,
            usuario_id: fila.usuario_id,
            autor: (fila.usuario_id && nombres.get(fila.usuario_id)) || 'Usuario',
        })),
    };
}

export async function agregarObservacion(supabase: SupabaseClient, contactoId: string, texto: string): Promise<{ ok: true } | { error: string }> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No hay una sesión activa.' };
    }

    const { error } = await supabase.from('actividades').insert({
        contacto_id: contactoId,
        usuario_id: user.id,
        tipo: 'MENSAJE',
        titulo: 'Observación',
        descripcion: texto.trim(),
        fecha: new Date().toISOString(),
    });

    if (error) {
        return { error: mensajeGuardado(error, 'guardar la observación') };
    }

    return { ok: true };
}
