import 'server-only';
import { createClient } from '../supabase/server';
import { aContacto, aEtapa, aFunnel, aInmueble, aMotivoPerdida, aOrigen, aUsuario } from '../mapeo';
import type { Database } from '@/types/database';
import type { Oportunidad, OportunidadDetalle, OportunidadRow, FiltroOportunidades, FormOptions, ColumnaEtapa, OportunidadCard, HistorialEtapaDetalle } from './types';

type OportunidadDbRow = Database['public']['Tables']['oportunidades']['Row'];

const RESPONSABLE = 'usuarios!oportunidades_responsable_id_fkey';

const SELECT_LISTA = `
    id, titulo, estado, valor_estimado,
    contacto:contactos(nombre, apellido),
    inmueble:inmuebles(direccion),
    responsable:${RESPONSABLE}(nombre, apellido),
    funnel:funnels(nombre),
    etapa:etapas(nombre)
`;

const SELECT_CARD = `
    id, titulo, etapa_id, estado, valor_estimado,
    contacto:contactos(nombre, apellido),
    inmueble:inmuebles(direccion),
    responsable:${RESPONSABLE}(nombre, apellido)
`;

const SELECT_DETALLE = `
    *,
    contacto:contactos(*),
    inmueble:inmuebles(*),
    responsable:${RESPONSABLE}(*),
    funnel:funnels(*),
    etapa:etapas(*),
    origen:origenes(*),
    motivoPerdida:motivos_perdida(*),
    historial:historial_etapas(
        *,
        etapaAnterior:etapas!historial_etapas_etapa_anterior_id_fkey(*),
        etapaNueva:etapas!historial_etapas_etapa_nueva_id_fkey(*),
        usuario:usuarios(*)
    )
`;

const nombreCompleto = (p: { nombre: string; apellido: string } | null) => (p ? `${p.nombre} ${p.apellido}`.trim() : '');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esUuid = (v: string | undefined | null): v is string => typeof v === 'string' && UUID.test(v);
const filtroUuid = (v: string | undefined) => (esUuid(v) ? v : undefined);

function aOportunidad(r: OportunidadDbRow): Oportunidad {
    return {
        id: r.id,
        titulo: r.titulo,
        contactoId: r.contacto_id,
        inmuebleId: r.inmueble_id,
        responsableId: r.responsable_id,
        funnelId: r.funnel_id,
        etapaId: r.etapa_id,
        estado: r.estado,
        valorEstimado: r.valor_estimado,
        origenId: r.origen_id,
        observaciones: r.observaciones,
        motivoPerdidaId: r.motivo_perdida_id,
        fechaCierreReal: r.fecha_cierre_real,
        activo: r.activo,
        creadoEn: r.creado_en,
        actualizadoEn: r.actualizado_en,
        creadoPor: r.creado_por ?? '',
        actualizadoPor: r.actualizado_por ?? '',
    };
}

export async function getOportunidades(filtro: FiltroOportunidades = {}): Promise<Oportunidad[]> {
    try {
        const supabase = await createClient();
        let q = supabase.from('oportunidades').select('*').eq('activo', true);

        const responsableId = filtroUuid(filtro.responsableId);
        const etapaId = filtroUuid(filtro.etapaId);
        const origenId = filtroUuid(filtro.origenId);
        const funnelId = filtroUuid(filtro.funnelId);

        if (responsableId) q = q.eq('responsable_id', responsableId);
        if (etapaId) q = q.eq('etapa_id', etapaId);
        if (filtro.estado) q = q.eq('estado', filtro.estado);
        if (origenId) q = q.eq('origen_id', origenId);
        if (funnelId) q = q.eq('funnel_id', funnelId);

        const { data, error } = await q.order('creado_en', { ascending: false });
        if (error) throw error;

        return (data ?? []).map(aOportunidad);
    } catch (err) {
        console.error('Error getOportunidades', err);
        return [];
    }
}

export async function getOportunidadesList(filtro: FiltroOportunidades = {}): Promise<OportunidadRow[]> {
    try {
        const supabase = await createClient();
        let q = supabase.from('oportunidades').select(SELECT_LISTA).eq('activo', true);

        const responsableId = filtroUuid(filtro.responsableId);
        const etapaId = filtroUuid(filtro.etapaId);
        const origenId = filtroUuid(filtro.origenId);
        const funnelId = filtroUuid(filtro.funnelId);

        if (responsableId) q = q.eq('responsable_id', responsableId);
        if (etapaId) q = q.eq('etapa_id', etapaId);
        if (filtro.estado) q = q.eq('estado', filtro.estado);
        if (origenId) q = q.eq('origen_id', origenId);
        if (funnelId) q = q.eq('funnel_id', funnelId);

        const { data, error } = await q.order('creado_en', { ascending: false });
        if (error) throw error;

        return (data ?? []).map((o) => ({
            id: o.id,
            titulo: o.titulo,
            contacto: nombreCompleto(o.contacto),
            inmueble: o.inmueble?.direccion ?? null,
            responsable: nombreCompleto(o.responsable),
            funnel: o.funnel?.nombre ?? '',
            etapa: o.etapa?.nombre ?? '',
            estado: o.estado,
            valorEstimado: o.valor_estimado,
        }));
    } catch (err) {
        console.error('Error getOportunidadesList', err);
        return [];
    }
}

export async function getOportunidadDetalle(id: string): Promise<OportunidadDetalle | null> {
    if (!esUuid(id)) return null;
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('oportunidades')
            .select(SELECT_DETALLE)
            .eq('id', id)
            .eq('activo', true)
            .order('creado_en', { referencedTable: 'historial_etapas', ascending: false })
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const historial: HistorialEtapaDetalle[] = (data.historial ?? []).map((h) => ({
            id: h.id,
            oportunidadId: h.oportunidad_id,
            etapaAnteriorId: h.etapa_anterior_id,
            etapaNuevaId: h.etapa_nueva_id,
            usuarioId: h.usuario_id ?? '',
            creadoEn: h.creado_en,
            observacion: h.observacion,
            etapaAnterior: h.etapaAnterior ? aEtapa(h.etapaAnterior) : null,
            etapaNueva: h.etapaNueva ? aEtapa(h.etapaNueva) : null,
            usuario: h.usuario ? aUsuario(h.usuario) : null,
        }));

        return {
            ...aOportunidad(data),
            contacto: data.contacto ? aContacto(data.contacto) : null,
            inmueble: data.inmueble ? aInmueble(data.inmueble) : null,
            responsable: data.responsable ? aUsuario(data.responsable) : null,
            funnel: data.funnel ? aFunnel(data.funnel) : null,
            etapa: data.etapa ? aEtapa(data.etapa) : null,
            origen: data.origen ? aOrigen(data.origen) : null,
            motivoPerdida: data.motivoPerdida ? aMotivoPerdida(data.motivoPerdida) : null,
            historial,
        };
    } catch (err) {
        console.error('Error getOportunidadDetalle', err);
        return null;
    }
}

export async function getOportunidad(id: string): Promise<Oportunidad | null> {
    if (!esUuid(id)) return null;
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('oportunidades').select('*').eq('id', id).eq('activo', true).maybeSingle();
        if (error) throw error;
        return data ? aOportunidad(data) : null;
    } catch (err) {
        console.error('Error getOportunidad', err);
        return null;
    }
}

export async function getOportunidadesPorEtapa(funnelId: string): Promise<{ funnelId: string; columnas: ColumnaEtapa[] }> {
    if (!esUuid(funnelId)) return { funnelId, columnas: [] };
    try {
        const supabase = await createClient();

        const [etapasRes, opsRes] = await Promise.all([
            supabase.from('etapas').select('*').eq('funnel_id', funnelId).order('orden', { ascending: true }),
            supabase.from('oportunidades').select(SELECT_CARD).eq('funnel_id', funnelId).eq('activo', true),
        ]);

        if (etapasRes.error) throw etapasRes.error;
        if (opsRes.error) throw opsRes.error;

        const porEtapa = new Map<string, OportunidadCard[]>();
        for (const o of opsRes.data ?? []) {
            const card: OportunidadCard = {
                id: o.id,
                titulo: o.titulo,
                contacto: nombreCompleto(o.contacto),
                inmueble: o.inmueble?.direccion ?? null,
                responsable: nombreCompleto(o.responsable),
                valorEstimado: o.valor_estimado,
                estado: o.estado,
            };
            const lista = porEtapa.get(o.etapa_id);
            if (lista) lista.push(card);
            else porEtapa.set(o.etapa_id, [card]);
        }

        const columnas: ColumnaEtapa[] = (etapasRes.data ?? []).map((e) => ({
            id: e.id,
            title: e.nombre,
            orden: e.orden,
            resultado: e.resultado,
            tasks: porEtapa.get(e.id) ?? [],
        }));

        return { funnelId, columnas };
    } catch (err) {
        console.error('Error getOportunidadesPorEtapa', err);
        return { funnelId, columnas: [] };
    }
}

export async function getFormOptions(): Promise<FormOptions> {
    const vacio: FormOptions = { usuarios: [], interesados: [], inmuebles: [], funnels: [], etapas: [], origenes: [], motivosPerdida: [] };

    try {
        const supabase = await createClient();
        const [usuarios, contactos, inmuebles, funnels, etapas, origenes, motivos] = await Promise.all([
            supabase.from('usuarios').select('*').eq('activo', true).order('apellido'),
            supabase.from('contactos').select('*').eq('activo', true).order('apellido'),
            supabase.from('inmuebles').select('*').eq('activo', true).order('direccion'),
            supabase.from('funnels').select('*').eq('activo', true),
            supabase.from('etapas').select('*').eq('activo', true).order('orden'),
            supabase.from('origenes').select('*').eq('activo', true).order('nombre'),
            supabase.from('motivos_perdida').select('*').eq('activo', true).order('nombre'),
        ]);

        const primerError = [usuarios, contactos, inmuebles, funnels, etapas, origenes, motivos].find((r) => r.error)?.error;
        if (primerError) throw primerError;

        return {
            usuarios: (usuarios.data ?? []).map(aUsuario),
            interesados: (contactos.data ?? []).map(aContacto),
            inmuebles: (inmuebles.data ?? []).map(aInmueble),
            funnels: (funnels.data ?? []).map(aFunnel),
            etapas: (etapas.data ?? []).map(aEtapa),
            origenes: (origenes.data ?? []).map(aOrigen),
            motivosPerdida: (motivos.data ?? []).map(aMotivoPerdida),
        };
    } catch (err) {
        console.error('Error getFormOptions', err);
        return vacio;
    }
}

export async function getFunnels() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('funnels').select('*').eq('activo', true);
        if (error) throw error;
        return (data ?? []).map(aFunnel);
    } catch (err) {
        console.error('Error getFunnels', err);
        return [];
    }
}
