import 'server-only';
import { createClient } from '../supabase/server';
import type { ActividadDetalle, TipoActividadOpcion, VinculoActividad } from './types';

export const COLUMNA_VINCULO = { contacto: 'contacto_id', inmueble: 'inmueble_id', oportunidad: 'oportunidad_id' } as const;

const nombreDe = (u: { nombre: string; apellido: string } | null) => (u ? `${u.nombre} ${u.apellido}`.trim() || 'Usuario' : 'Usuario');

export async function getActividades(
    vinculo: VinculoActividad,
    { incluirBajas, usuarioId, esAdmin }: { incluirBajas: boolean; usuarioId: string; esAdmin: boolean },
): Promise<ActividadDetalle[]> {
    const supabase = await createClient();
    let consulta = supabase
        .from('actividades')
        .select(
            'id, titulo, descripcion, fecha, activo, usuario_id, dado_de_baja_en, tipo:tipos_actividad!inner(nombre, clave), autor:usuarios!actividades_usuario_id_fkey(nombre, apellido), baja:usuarios!actividades_dado_de_baja_por_fkey(nombre, apellido), oportunidad:oportunidades(id, titulo)',
        )
        .eq(COLUMNA_VINCULO[vinculo.tipo], vinculo.id)
        .is('tipo.clave', null)
        .order('fecha', { ascending: false });

    if (!incluirBajas) consulta = consulta.eq('activo', true);

    const { data, error } = await consulta;
    if (error) throw error;

    return (data ?? []).map((a) => ({
        id: a.id,
        tipo: a.tipo.nombre,
        titulo: a.titulo,
        descripcion: a.descripcion,
        fecha: a.fecha,
        autor: nombreDe(a.autor),
        activo: a.activo,
        dadaDeBajaPor: a.activo ? null : nombreDe(a.baja),
        dadaDeBajaEn: a.dado_de_baja_en,
        oportunidad: a.oportunidad ? { id: a.oportunidad.id, titulo: a.oportunidad.titulo } : null,
        puedeDarDeBaja: a.activo && (a.usuario_id === usuarioId || esAdmin),
    }));
}

export async function getTiposActividadActivos(): Promise<TipoActividadOpcion[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('tipos_actividad').select('id, nombre').eq('activo', true).is('clave', null).order('nombre');
    if (error) throw error;
    return data ?? [];
}
