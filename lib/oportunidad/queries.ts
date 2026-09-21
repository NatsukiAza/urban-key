import 'server-only';
import { db } from '../mock/store';
import type { Oportunidad, OportunidadDetalle, OportunidadRow, FiltroOportunidades, FormOptions, ColumnaEtapa, OportunidadCard, HistorialEtapaDetalle } from './types';
import type { Contacto, Inmueble } from '../dominio';

const nombreContacto = (c?: Contacto | null) => (c ? `${c.nombre} ${c.apellido}` : '');
const nombreInmueble = (i?: Inmueble | null) => (i ? i.direccion : null);

export async function getOportunidades(filtro: FiltroOportunidades = {}): Promise<Oportunidad[]> {
    try {
        return db.oportunidades
            .filter((o) => o.activo)
            .filter((o) => (filtro.responsableId ? o.responsableId === filtro.responsableId : true))
            .filter((o) => (filtro.etapaId ? o.etapaId === filtro.etapaId : true))
            .filter((o) => (filtro.estado ? o.estado === filtro.estado : true))
            .filter((o) => (filtro.origenId ? o.origenId === filtro.origenId : true))
            .filter((o) => (filtro.funnelId ? o.funnelId === filtro.funnelId : true))
            .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1));
    } catch (err) {
        console.error('Error getOportunidades', err);
        return [];
    }
}

export async function getOportunidadesList(filtro: FiltroOportunidades = {}): Promise<OportunidadRow[]> {
    const oportunidades = await getOportunidades(filtro);
    return oportunidades.map((o) => ({
        id: o.id,
        titulo: o.titulo,
        contacto: nombreContacto(db.contactos.find((c) => c.id === o.contactoId)),
        inmueble: nombreInmueble(db.inmuebles.find((i) => i.id === o.inmuebleId)),
        responsable: (() => {
            const u = db.usuarios.find((x) => x.id === o.responsableId);
            return u ? `${u.nombre} ${u.apellido}` : '';
        })(),
        funnel: db.funnels.find((f) => f.id === o.funnelId)?.nombre ?? '',
        etapa: db.etapas.find((e) => e.id === o.etapaId)?.nombre ?? '',
        estado: o.estado,
        valorEstimado: o.valorEstimado,
    }));
}

export async function getOportunidadDetalle(id: string): Promise<OportunidadDetalle | null> {
    try {
        const o = db.oportunidades.find((x) => x.id === id && x.activo);
        if (!o) return null;
        const historial: HistorialEtapaDetalle[] = db.historialEtapas
            .filter((h) => h.oportunidadId === id)
            .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))
            .map((h) => ({
                ...h,
                etapaAnterior: db.etapas.find((e) => e.id === h.etapaAnteriorId) ?? null,
                etapaNueva: db.etapas.find((e) => e.id === h.etapaNuevaId) ?? null,
                usuario: db.usuarios.find((u) => u.id === h.usuarioId) ?? null,
            }));
        return {
            ...o,
            contacto: db.contactos.find((c) => c.id === o.contactoId) ?? null,
            inmueble: db.inmuebles.find((i) => i.id === o.inmuebleId) ?? null,
            responsable: db.usuarios.find((u) => u.id === o.responsableId) ?? null,
            funnel: db.funnels.find((f) => f.id === o.funnelId) ?? null,
            etapa: db.etapas.find((e) => e.id === o.etapaId) ?? null,
            origen: db.origenes.find((x) => x.id === o.origenId) ?? null,
            motivoPerdida: db.motivosPerdida.find((m) => m.id === o.motivoPerdidaId) ?? null,
            historial,
        };
    } catch (err) {
        console.error('Error getOportunidadDetalle', err);
        return null;
    }
}

export async function getOportunidad(id: string): Promise<Oportunidad | null> {
    return db.oportunidades.find((x) => x.id === id && x.activo) ?? null;
}

export async function getOportunidadesPorEtapa(funnelId: string): Promise<{ funnelId: string; columnas: ColumnaEtapa[] }> {
    try {
        const etapas = db.etapas.filter((e) => e.funnelId === funnelId).sort((a, b) => a.orden - b.orden);
        const columnas: ColumnaEtapa[] = etapas.map((e) => {
            const tasks: OportunidadCard[] = db.oportunidades
                .filter((o) => o.activo && o.etapaId === e.id)
                .map((o) => ({
                    id: o.id,
                    titulo: o.titulo,
                    contacto: nombreContacto(db.contactos.find((c) => c.id === o.contactoId)),
                    inmueble: nombreInmueble(db.inmuebles.find((i) => i.id === o.inmuebleId)),
                    responsable: nombreContacto(db.usuarios.find((u) => u.id === o.responsableId) as any),
                    valorEstimado: o.valorEstimado,
                    estado: o.estado,
                }));
            return { id: e.id, title: e.nombre, orden: e.orden, resultado: e.resultado, tasks };
        });
        return { funnelId, columnas };
    } catch (err) {
        console.error('Error getOportunidadesPorEtapa', err);
        return { funnelId, columnas: [] };
    }
}

export async function getFormOptions(): Promise<FormOptions> {
    return {
        usuarios: db.usuarios,
        interesados: db.contactos.filter((c) => c.activo),
        inmuebles: db.inmuebles.filter((i) => i.activo),
        funnels: db.funnels,
        etapas: db.etapas,
        origenes: db.origenes,
        motivosPerdida: db.motivosPerdida,
    };
}

export async function getFunnels() {
    return db.funnels;
}
