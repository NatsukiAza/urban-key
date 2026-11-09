import type { EstadoContacto } from '../enums/estadoContacto';

// Módulo sincrónico a propósito. Las acciones de servidor lo importan, y no puede
// vivir en contactos.ts: ese archivo exporta funciones async que el navegador llama
// directo. Si un archivo 'use server' lo importa, Next las deja de exponer como función.

export const CONTACTO_COLUMNS_BASE =
    'id, nombre, apellido, email, telefono, estado, es_propietario, es_interesado, observaciones, sucursal_id, activo, creado_por, creado_en';

export const CONTACTO_COLUMNS = `${CONTACTO_COLUMNS_BASE}, origen_id, responsable_id`;

export const LIMITES_CONTACTO = { nombre: 40, apellido: 40, email: 60, telefono: 20 } as const;

export const limpiarTelefono = (valor: string) => valor.replace(/[^\d\s-]/g, '').slice(0, LIMITES_CONTACTO.telefono);

export const faltaColumnaNueva = (error: { code?: string; message?: string } | null | undefined) => {
    const mensaje = error?.message ?? '';
    return error?.code === '42703' || error?.code === 'PGRST200' || /origen_id|responsable_id|relationship|schema cache/i.test(mensaje);
};

function uno<T>(valor: T | T[] | null | undefined): T | null {
    if (!valor) return null;
    return Array.isArray(valor) ? (valor[0] ?? null) : valor;
}

export function mapContacto(row: {
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
    responsable_id: string;
    origen?: { nombre: string } | { nombre: string }[] | null;
    responsable?: { nombre: string; apellido: string } | { nombre: string; apellido: string }[] | null;
}) {
    const origen = uno(row.origen);
    const responsable = uno(row.responsable);
    return {
        id: row.id,
        nombre: row.nombre,
        apellido: row.apellido,
        email: row.email,
        telefono: row.telefono,
        estado: row.estado,
        es_propietario: row.es_propietario,
        es_interesado: row.es_interesado,
        observaciones: row.observaciones,
        sucursal_id: row.sucursal_id,
        activo: row.activo,
        creado_por: row.creado_por,
        creado_en: row.creado_en,
        origen_id: row.origen_id,
        origen_nombre: origen?.nombre ?? null,
        responsable_id: row.responsable_id,
        responsable_nombre: responsable ? `${responsable.nombre} ${responsable.apellido}`.trim() : '',
    };
}
