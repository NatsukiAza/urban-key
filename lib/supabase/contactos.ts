import type { SupabaseClient } from '@supabase/supabase-js';
import type { RolUsuario } from '../enums/rolUsuario';
import { CONTACTO_COLUMNS, CONTACTO_COLUMNS_BASE, faltaColumnaNueva, mapContacto } from '../contacto/fila';

export { CONTACTO_COLUMNS, mapContacto };

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
    creado_en: string;
    origen_id: string | null;
    origen_nombre: string | null;
    responsable_id: string;
    responsable_nombre: string;
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
    origen_id?: string;
    responsable_id?: string;
};

export type ContextoContacto = {
    yo: { id: string; nombre: string; apellido: string; rol: RolUsuario } | null;
    origenes: { id: string; nombre: string }[];
    usuarios: { id: string; nombre: string; apellido: string }[];
};

const TIPO_OBSERVACION = 'OBSERVACION';

const CONTACTO_CON_NOMBRES = `${CONTACTO_COLUMNS}, origen:origenes(nombre), responsable:usuarios!contactos_responsable_id_fkey(nombre, apellido)`;

export function nombreContacto(contacto: Pick<Contacto, 'nombre' | 'apellido'>) {
    return `${contacto.nombre} ${contacto.apellido}`.trim();
}

function mensajeGuardado(error: { code?: string; message?: string }, accion: string) {
    if (error.code === '42501') {
        return `No se pudo ${accion}. El proyecto de Supabase no permite esa escritura.`;
    }
    return `No se pudo ${accion}.`;
}

function filaContacto(fila: Record<string, unknown>) {
    return mapContacto({
        ...(fila as Parameters<typeof mapContacto>[0]),
        origen_id: (fila.origen_id as string | null | undefined) ?? null,
        responsable_id: (fila.responsable_id as string | undefined) || (fila.creado_por as string | undefined) || '',
    });
}

export async function listarContactos(supabase: SupabaseClient): Promise<{ contactos: Contacto[] } | { error: string }> {
    const ordenado = () => supabase.from('contactos').select(CONTACTO_CON_NOMBRES).eq('activo', true).order('apellido', { ascending: true }).order('nombre', { ascending: true });
    let { data, error } = await ordenado();

    if (faltaColumnaNueva(error)) {
        const retry = await supabase.from('contactos').select(CONTACTO_COLUMNS_BASE).eq('activo', true).order('apellido', { ascending: true }).order('nombre', { ascending: true });
        data = retry.data as typeof data;
        error = retry.error;
    }

    if (error) {
        console.error('Error listando contactos', error);
        return { error: 'No se pudieron leer los contactos.' };
    }

    return { contactos: (data ?? []).map((fila) => filaContacto(fila as Record<string, unknown>)) };
}

export async function obtenerContacto(supabase: SupabaseClient, id: string): Promise<{ contacto: Contacto } | { error: string }> {
    let { data, error } = await supabase.from('contactos').select(CONTACTO_CON_NOMBRES).eq('id', id).eq('activo', true).maybeSingle();

    if (faltaColumnaNueva(error)) {
        const retry = await supabase.from('contactos').select(CONTACTO_COLUMNS_BASE).eq('id', id).eq('activo', true).maybeSingle();
        data = retry.data as typeof data;
        error = retry.error;
    }

    if (error) {
        console.error('Error leyendo el contacto', error);
        return { error: 'No se pudo leer el contacto.' };
    }
    if (!data) {
        return { error: 'No encontramos ese contacto.' };
    }

    return { contacto: filaContacto(data as Record<string, unknown>) };
}

export async function listarContextoContacto(supabase: SupabaseClient): Promise<ContextoContacto> {
    const vacio: ContextoContacto = { yo: null, origenes: [], usuarios: [] };
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return vacio;

    const [perfil, origenes, usuarios] = await Promise.all([
        supabase.from('usuarios').select('id, nombre, apellido, rol').eq('id', user.id).maybeSingle(),
        supabase.from('origenes').select('id, nombre').eq('activo', true).order('nombre'),
        supabase.from('usuarios').select('id, nombre, apellido').eq('activo', true).order('apellido').order('nombre'),
    ]);

    return {
        yo: perfil.data ? { id: perfil.data.id, nombre: perfil.data.nombre, apellido: perfil.data.apellido, rol: perfil.data.rol } : null,
        origenes: origenes.data ?? [],
        usuarios: usuarios.data ?? [],
    };
}

export async function crearContacto(supabase: SupabaseClient, input: ContactoInput): Promise<{ contacto: Contacto } | { error: string }> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No hay una sesión activa.' };
    }
    if (!input.email.trim() && !input.telefono.trim()) {
        return { error: 'Cargá al menos un teléfono o un email.' };
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
            origen_id: input.origen_id || null,
            responsable_id: input.responsable_id || user.id,
            creado_por: user.id,
            activo: true,
        })
        .select(CONTACTO_COLUMNS)
        .single();

    if (error || !data) {
        return { error: mensajeGuardado(error ?? {}, 'guardar el contacto') };
    }

    return { contacto: mapContacto(data) };
}

export async function actualizarContacto(supabase: SupabaseClient, id: string, input: ContactoInput): Promise<{ contacto: Contacto } | { error: string }> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!input.email.trim() && !input.telefono.trim()) {
        return { error: 'Cargá al menos un teléfono o un email.' };
    }

    const { data, error } = await supabase
        .from('contactos')
        .update({
            nombre: input.nombre.trim(),
            apellido: input.apellido.trim(),
            email: input.email.trim() || null,
            telefono: input.telefono.trim() || null,
            estado: input.estado,
            es_propietario: input.es_propietario,
            es_interesado: input.es_interesado,
            observaciones: input.observaciones.trim() || null,
            origen_id: input.origen_id || null,
            actualizado_por: user?.id ?? null,
        })
        .eq('id', id)
        .select(CONTACTO_COLUMNS)
        .single();

    if (error || !data) {
        return { error: mensajeGuardado(error ?? {}, 'guardar los cambios') };
    }

    return { contacto: mapContacto(data) };
}

// Devuelve el contacto activo que ya usa ese email (sin distinguir mayúsculas), ignorando `excluirId`.
export async function buscarContactoPorEmail(supabase: SupabaseClient, email: string, excluirId?: string): Promise<{ id: string; nombre: string; apellido: string } | null> {
    const limpio = email.trim();
    if (!limpio) return null;
    const patron = limpio.replace(/([\\%_])/g, '\\$1');
    let consulta = supabase.from('contactos').select('id, nombre, apellido').eq('activo', true).ilike('email', patron);
    if (excluirId) consulta = consulta.neq('id', excluirId);
    const { data } = await consulta.limit(1).maybeSingle();
    return data ?? null;
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

    return { contacto: mapContacto(data) };
}

export async function listarObservaciones(supabase: SupabaseClient, contactoId: string): Promise<{ observaciones: Observacion[] } | { error: string }> {
    const { data, error } = await supabase
        .from('actividades')
        .select('id, descripcion, fecha, usuario_id, tipos_actividad!inner(clave)')
        .eq('contacto_id', contactoId)
        .eq('tipos_actividad.clave', TIPO_OBSERVACION)
        .eq('activo', true)
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

    const { data: tipo } = await supabase.from('tipos_actividad').select('id').eq('clave', TIPO_OBSERVACION).single();

    if (!tipo) {
        return { error: 'No se encontró el tipo de actividad para observaciones.' };
    }

    const { error } = await supabase.from('actividades').insert({
        contacto_id: contactoId,
        usuario_id: user.id,
        tipo_id: tipo.id,
        titulo: 'Observación',
        descripcion: texto.trim(),
        resultado: texto.trim(),
        fecha: new Date().toISOString(),
    });

    if (error) {
        return { error: mensajeGuardado(error, 'guardar la observación') };
    }

    return { ok: true };
}

export type OportunidadDeContacto = {
    id: string;
    titulo: string;
    estado: 'ABIERTA' | 'GANADA' | 'PERDIDA';
    valorEstimado: number | null;
    moneda: 'ARS' | 'USD';
    etapa: string;
    funnel: string;
    inmueble: string;
};

export type InmuebleDeContacto = {
    id: string;
    direccion: string;
    localidad: string | null;
    tipoOperacion: 'VENTA' | 'ALQUILER';
    tipoInmueble: 'CASA' | 'DEPARTAMENTO' | 'PH';
    estado: 'DISPONIBLE' | 'RESERVADO' | 'OPERADO' | 'RETIRADO';
    ambientes: number | null;
    m2: number | null;
    precio: number | null;
    moneda: 'ARS' | 'USD';
};

export async function listarOportunidadesDeContacto(supabase: SupabaseClient, contactoId: string): Promise<OportunidadDeContacto[]> {
    const { data } = await supabase
        .from('oportunidades')
        .select('id, titulo, estado, valor_estimado, moneda, etapa:etapas(nombre), funnel:funnels(nombre), inmueble:inmuebles(direccion, localidad)')
        .eq('contacto_id', contactoId)
        .eq('activo', true)
        .order('creado_en', { ascending: false });
    return (data ?? []).map((o: any) => ({
        id: o.id,
        titulo: o.titulo,
        estado: o.estado,
        valorEstimado: o.valor_estimado,
        moneda: o.moneda,
        etapa: o.etapa?.nombre ?? '',
        funnel: o.funnel?.nombre ?? '',
        inmueble: o.inmueble ? [o.inmueble.direccion, o.inmueble.localidad].filter(Boolean).join(', ') : '',
    }));
}

export async function listarInmueblesDeContacto(supabase: SupabaseClient, contactoId: string): Promise<InmuebleDeContacto[]> {
    const { data } = await supabase
        .from('inmuebles')
        .select('id, direccion, localidad, tipo_operacion, tipo_inmueble, estado, ambientes, m2, precio, moneda')
        .eq('contacto_id', contactoId)
        .eq('activo', true)
        .order('creado_en', { ascending: false });
    return (data ?? []).map((i: any) => ({
        id: i.id,
        direccion: i.direccion,
        localidad: i.localidad,
        tipoOperacion: i.tipo_operacion,
        tipoInmueble: i.tipo_inmueble,
        estado: i.estado,
        ambientes: i.ambientes,
        m2: i.m2,
        precio: i.precio,
        moneda: i.moneda,
    }));
}

export async function nombreDeUsuario(supabase: SupabaseClient, usuarioId: string | null): Promise<string | null> {
    if (!usuarioId) return null;
    const { data } = await supabase.from('usuarios').select('nombre, apellido').eq('id', usuarioId).maybeSingle();
    return data ? `${data.nombre} ${data.apellido}`.trim() : null;
}
