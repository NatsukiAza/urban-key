import 'server-only';
import { createClient } from '../supabase/server';
import { aContacto, aInmueble } from '../mapeo';
import type { Inmueble, InmuebleDetalle, InmuebleRow, FiltroInmuebles, InmuebleFormOptions, OportunidadDeInmueble } from './types';

const RESPONSABLE = 'usuarios!oportunidades_responsable_id_fkey';

const SELECT_LISTA = `
    id, direccion, localidad, tipo_operacion, tipo_inmueble, estado, ambientes, dormitorios, m2, precio, moneda,
    propietario:contactos(nombre, apellido)
`;

const SELECT_DETALLE = `
    *,
    propietario:contactos(*),
    oportunidades(
        id, titulo, estado, activo,
        contacto:contactos(nombre, apellido),
        responsable:${RESPONSABLE}(nombre, apellido),
        funnel:funnels(nombre),
        etapa:etapas(nombre)
    )
`;

const nombreCompleto = (p: { nombre: string; apellido: string } | null) => (p ? `${p.nombre} ${p.apellido}`.trim() : '');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esUuid = (v: string | undefined | null): v is string => typeof v === 'string' && UUID.test(v);

export async function getInmueblesList(filtro: FiltroInmuebles = {}): Promise<InmuebleRow[]> {
    try {
        const supabase = await createClient();
        let q = supabase.from('inmuebles').select(SELECT_LISTA).eq('activo', true);

        if (filtro.tipoOperacion) q = q.eq('tipo_operacion', filtro.tipoOperacion);
        if (filtro.tipoInmueble) q = q.eq('tipo_inmueble', filtro.tipoInmueble);
        if (filtro.estado) q = q.eq('estado', filtro.estado);
        if (filtro.localidad) q = q.eq('localidad', filtro.localidad);

        const { data, error } = await q.order('creado_en', { ascending: false });
        if (error) throw error;

        return (data ?? []).map((i) => ({
            id: i.id,
            direccion: i.direccion,
            localidad: i.localidad,
            propietario: nombreCompleto(i.propietario),
            tipoOperacion: i.tipo_operacion,
            tipoInmueble: i.tipo_inmueble,
            estado: i.estado,
            ambientes: i.ambientes,
            dormitorios: i.dormitorios,
            m2: i.m2,
            precio: i.precio,
            moneda: i.moneda,
        }));
    } catch (err) {
        console.error('Error getInmueblesList', err);
        return [];
    }
}

export async function getInmueble(id: string): Promise<Inmueble | null> {
    if (!esUuid(id)) return null;
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('inmuebles').select('*').eq('id', id).eq('activo', true).maybeSingle();
        if (error) throw error;
        return data ? aInmueble(data) : null;
    } catch (err) {
        console.error('Error getInmueble', err);
        return null;
    }
}

export async function getInmuebleDetalle(id: string): Promise<InmuebleDetalle | null> {
    if (!esUuid(id)) return null;
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('inmuebles').select(SELECT_DETALLE).eq('id', id).eq('activo', true).maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const oportunidades: OportunidadDeInmueble[] = (data.oportunidades ?? [])
            .filter((o) => o.activo)
            .map((o) => ({
                id: o.id,
                titulo: o.titulo,
                contacto: nombreCompleto(o.contacto),
                responsable: nombreCompleto(o.responsable),
                funnel: o.funnel?.nombre ?? '',
                etapa: o.etapa?.nombre ?? '',
                estado: o.estado,
            }));

        return {
            ...aInmueble(data),
            propietario: data.propietario ? aContacto(data.propietario) : null,
            oportunidades,
        };
    } catch (err) {
        console.error('Error getInmuebleDetalle', err);
        return null;
    }
}

export async function getInmuebleFormOptions(): Promise<InmuebleFormOptions> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('contactos').select('*').eq('activo', true).eq('es_propietario', true).order('apellido');
        if (error) throw error;
        return { propietarios: (data ?? []).map(aContacto) };
    } catch (err) {
        console.error('Error getInmuebleFormOptions', err);
        return { propietarios: [] };
    }
}

export async function getLocalidades(): Promise<string[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('inmuebles').select('localidad').eq('activo', true).not('localidad', 'is', null);
        if (error) throw error;
        const unicas = new Set((data ?? []).map((i) => i.localidad).filter((l): l is string => !!l));
        return [...unicas].sort((a, b) => a.localeCompare(b, 'es'));
    } catch (err) {
        console.error('Error getLocalidades', err);
        return [];
    }
}
