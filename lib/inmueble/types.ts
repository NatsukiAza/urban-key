import type { TipoOperacion } from '../enums/tipoOperacion';
import type { TipoInmueble } from '../enums/tipoInmueble';
import type { EstadoInmueble } from '../enums/estadoInmueble';
import type { Moneda } from '../enums/moneda';
import type { EstadoOportunidad } from '../enums/estadoOportunidad';
import type { Contacto, Inmueble } from '../dominio';

export type { Inmueble };

export interface InmuebleInput {
    contactoId: string;
    nombre?: string | null;
    direccion: string;
    localidad?: string | null;
    tipoOperacion: TipoOperacion;
    tipoInmueble: TipoInmueble;
    estado: EstadoInmueble;
    ambientes?: number | null;
    dormitorios?: number | null;
    banos?: number | null;
    m2?: number | null;
    cochera: boolean;
    antiguedad?: number | null;
    precio?: number | null;
    moneda: Moneda;
    expensas?: number | null;
    descripcion?: string | null;
}

export interface InmuebleRow {
    id: string;
    direccion: string;
    localidad: string | null;
    propietario: string;
    tipoOperacion: TipoOperacion;
    tipoInmueble: TipoInmueble;
    estado: EstadoInmueble;
    ambientes: number | null;
    dormitorios: number | null;
    m2: number | null;
    precio: number | null;
    moneda: Moneda;
}

export interface OportunidadDeInmueble {
    id: string;
    titulo: string;
    contacto: string;
    responsable: string;
    funnel: string;
    etapa: string;
    estado: EstadoOportunidad;
}

export interface InmuebleDetalle extends Inmueble {
    propietario: Contacto | null;
    oportunidades: OportunidadDeInmueble[];
}

export interface FiltroInmuebles {
    tipoOperacion?: TipoOperacion;
    tipoInmueble?: TipoInmueble;
    estado?: EstadoInmueble;
    localidad?: string;
}

export interface InmuebleFormOptions {
    propietarios: Contacto[];
}
