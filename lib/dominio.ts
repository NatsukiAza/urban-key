import type { EstadoOportunidad } from './enums/estadoOportunidad';
import type { EstadoContacto } from './enums/estadoContacto';
import type { TipoFunnel } from './enums/tipoFunnel';
import type { TipoOperacion } from './enums/tipoOperacion';
import type { RolUsuario } from './enums/rolUsuario';

// Entidades compartidas del dominio. Con Supabase, estas formas saldrán de types/database.ts.
// Por ahora las define el mock. Contactos e inmuebles son de otros módulos (personas 3 y 4);
// acá se consumen en modo lectura para relacionarlos con la oportunidad.

export interface Usuario {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: RolUsuario;
}

export interface Contacto {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    estado: EstadoContacto;
    esPropietario: boolean;
    esInteresado: boolean;
    activo: boolean;
}

export interface Inmueble {
    id: string;
    contactoId: string;
    tipoOperacion: TipoOperacion;
    direccion: string;
    ambientes: number;
    m2: number;
    precio: number;
    activo: boolean;
}

export interface Funnel {
    id: string;
    tipo: TipoFunnel;
    nombre: string;
}

export interface Etapa {
    id: string;
    funnelId: string;
    nombre: string;
    orden: number;
    esFinal: boolean;
    resultado: EstadoOportunidad;
}

export interface Origen {
    id: string;
    nombre: string;
}

export interface MotivoPerdida {
    id: string;
    nombre: string;
}
