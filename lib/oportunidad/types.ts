import type { EstadoOportunidad } from '../enums/estadoOportunidad';
import type { Contacto, Inmueble, Usuario, Funnel, Etapa, Origen, MotivoPerdida } from '../dominio';

export interface Oportunidad {
    id: string;
    titulo: string;
    contactoId: string;
    inmuebleId: string | null;
    responsableId: string;
    funnelId: string;
    etapaId: string;
    estado: EstadoOportunidad;
    valorEstimado: number | null;
    origenId: string | null;
    observaciones: string | null;
    motivoPerdidaId: string | null;
    fechaCierreReal: string | null;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
    creadoPor: string;
    actualizadoPor: string;
}

// DTO de escritura: lo que manda el formulario a la Server Action.
export interface OportunidadInput {
    titulo: string;
    contactoId: string;
    inmuebleId?: string | null;
    responsableId: string;
    funnelId: string;
    etapaId: string;
    valorEstimado?: number | null;
    origenId?: string | null;
    observaciones?: string | null;
}

export interface HistorialEtapa {
    id: string;
    oportunidadId: string;
    etapaAnteriorId: string | null;
    etapaNuevaId: string;
    usuarioId: string;
    creadoEn: string;
    observacion: string | null;
}

export interface HistorialEtapaDetalle extends HistorialEtapa {
    etapaAnterior: Etapa | null;
    etapaNueva: Etapa | null;
    usuario: Usuario | null;
}

// DTO de lectura con relaciones resueltas (composición, no aplanado).
export interface OportunidadDetalle extends Oportunidad {
    contacto: Contacto | null;
    inmueble: Inmueble | null;
    responsable: Usuario | null;
    funnel: Funnel | null;
    etapa: Etapa | null;
    origen: Origen | null;
    motivoPerdida: MotivoPerdida | null;
    historial: HistorialEtapaDetalle[];
}

// Fila enriquecida para la tabla de listado (relaciones resueltas a texto).
export interface OportunidadRow {
    id: string;
    titulo: string;
    contacto: string;
    inmueble: string | null;
    responsable: string;
    funnel: string;
    etapa: string;
    estado: EstadoOportunidad;
    valorEstimado: number | null;
}

export interface FiltroOportunidades {
    responsableId?: string;
    etapaId?: string;
    estado?: EstadoOportunidad;
    origenId?: string;
    funnelId?: string;
}

// Opciones para poblar los selects del formulario.
export interface FormOptions {
    usuarios: Usuario[];
    interesados: Contacto[];
    inmuebles: Inmueble[];
    funnels: Funnel[];
    etapas: Etapa[];
    origenes: Origen[];
    motivosPerdida: MotivoPerdida[];
}

// Columna del tablero (una por etapa del funnel activo).
export interface ColumnaEtapa {
    id: string;
    title: string;
    orden: number;
    resultado: EstadoOportunidad;
    tasks: OportunidadCard[];
}

export interface OportunidadCard {
    id: string;
    titulo: string;
    contacto: string;
    inmueble: string | null;
    responsable: string;
    valorEstimado: number | null;
    estado: EstadoOportunidad;
}
