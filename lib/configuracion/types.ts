import type { EstadoOportunidad } from '../enums/estadoOportunidad';
import type { Funnel } from '../dominio';

export interface EtapaConfig {
    id: string;
    funnelId: string;
    nombre: string;
    orden: number;
    resultado: EstadoOportunidad;
    activo: boolean;
    oportunidadesAbiertas: number;
}

export interface EmbudosConfig {
    funnels: Funnel[];
    etapas: EtapaConfig[];
    error: boolean;
}

export interface MotivoPerdidaConfig {
    id: string;
    nombre: string;
    activo: boolean;
}
