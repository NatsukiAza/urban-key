import type { Database } from '@/types/database';
import type { Usuario, Contacto, Inmueble, Funnel, Etapa, Origen, MotivoPerdida } from './dominio';

type Tablas = Database['public']['Tables'];

export type UsuarioRow = Tablas['usuarios']['Row'];
export type ContactoRow = Tablas['contactos']['Row'];
export type InmuebleRow = Tablas['inmuebles']['Row'];
export type FunnelRow = Tablas['funnels']['Row'];
export type EtapaRow = Tablas['etapas']['Row'];
export type OrigenRow = Tablas['origenes']['Row'];
export type MotivoPerdidaRow = Tablas['motivos_perdida']['Row'];

export const aUsuario = (r: UsuarioRow): Usuario => ({
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    email: r.email,
    rol: r.rol,
});

export const aContacto = (r: ContactoRow): Contacto => ({
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    email: r.email ?? '',
    telefono: r.telefono ?? '',
    estado: r.estado,
    esPropietario: r.es_propietario,
    esInteresado: r.es_interesado,
    activo: r.activo,
});

export const aInmueble = (r: InmuebleRow): Inmueble => ({
    id: r.id,
    contactoId: r.contacto_id,
    tipoOperacion: r.tipo_operacion,
    direccion: r.direccion,
    ambientes: r.ambientes ?? 0,
    m2: r.m2 ?? 0,
    precio: r.precio ?? 0,
    activo: r.activo,
});

export const aFunnel = (r: FunnelRow): Funnel => ({
    id: r.id,
    tipo: r.tipo,
    nombre: r.nombre,
});

export const aEtapa = (r: EtapaRow): Etapa => ({
    id: r.id,
    funnelId: r.funnel_id,
    nombre: r.nombre,
    orden: r.orden,
    esFinal: r.es_final,
    resultado: r.resultado,
});

export const aOrigen = (r: OrigenRow): Origen => ({ id: r.id, nombre: r.nombre });

export const aMotivoPerdida = (r: MotivoPerdidaRow): MotivoPerdida => ({ id: r.id, nombre: r.nombre });
