export type TipoVinculo = 'contacto' | 'inmueble' | 'oportunidad';

export interface VinculoActividad {
    tipo: TipoVinculo;
    id: string;
}

export interface TipoActividadOpcion {
    id: string;
    nombre: string;
}

export interface ActividadDetalle {
    id: string;
    tipo: string;
    titulo: string;
    descripcion: string | null;
    fecha: string;
    autor: string;
    activo: boolean;
    dadaDeBajaPor: string | null;
    dadaDeBajaEn: string | null;
    oportunidad: { id: string; titulo: string } | null;
    puedeDarDeBaja: boolean;
}

export interface PanelActividadesData {
    actividades: ActividadDetalle[];
    tipos: TipoActividadOpcion[];
    verBajas: boolean;
}

export interface ActividadInput {
    vinculo: VinculoActividad;
    tipoId: string;
    titulo?: string | null;
    descripcion?: string | null;
    fecha: string;
}
