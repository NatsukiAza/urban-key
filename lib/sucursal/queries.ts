import 'server-only';
import { createClient } from '../supabase/server';
import type { Inmobiliaria, Sucursal, SucursalDetalle, UsuarioDeSucursal } from './types';
import type { RolUsuario } from '../enums/rolUsuario';

type InmobiliariaRow = {
    id: string;
    nombre: string;
    cuit: string | null;
    activo: boolean;
};

type SucursalRow = {
    id: string;
    inmobiliaria_id: string;
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    activo: boolean;
};

type UsuarioEmbed = {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: RolUsuario;
    activo: boolean;
    sucursal_id: string | null;
    sucursal: { nombre: string } | { nombre: string }[] | null;
};

const aInmobiliaria = (r: InmobiliariaRow): Inmobiliaria => ({
    id: r.id,
    nombre: r.nombre,
    cuit: r.cuit,
    activo: r.activo,
});

const aSucursal = (r: SucursalRow): Sucursal => ({
    id: r.id,
    inmobiliariaId: r.inmobiliaria_id,
    nombre: r.nombre,
    direccion: r.direccion,
    telefono: r.telefono,
    activo: r.activo,
});

const nombreSucursal = (sucursal: UsuarioEmbed['sucursal']) => {
    if (!sucursal) return null;
    return Array.isArray(sucursal) ? (sucursal[0]?.nombre ?? null) : sucursal.nombre;
};

const aUsuario = (r: UsuarioEmbed): UsuarioDeSucursal => ({
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    email: r.email,
    rol: r.rol,
    activo: r.activo,
    sucursalId: r.sucursal_id,
    sucursalNombre: nombreSucursal(r.sucursal),
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getInmobiliaria(): Promise<Inmobiliaria | null> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('inmobiliarias').select('id, nombre, cuit, activo').eq('activo', true).order('creado_en').limit(1).maybeSingle();
        if (error) {
            console.error('Error leyendo la inmobiliaria', error);
            return null;
        }
        return data ? aInmobiliaria(data) : null;
    } catch (error) {
        console.error('Error leyendo la inmobiliaria', error);
        return null;
    }
}

export async function getSucursales(): Promise<Sucursal[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('sucursales').select('id, inmobiliaria_id, nombre, direccion, telefono, activo').order('nombre');
        if (error) {
            console.error('Error listando sucursales', error);
            return [];
        }
        return (data ?? []).map(aSucursal);
    } catch (error) {
        console.error('Error listando sucursales', error);
        return [];
    }
}

export async function getSucursal(id: string): Promise<SucursalDetalle | null> {
    if (!UUID.test(id)) return null;
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('sucursales')
            .select('id, inmobiliaria_id, nombre, direccion, telefono, activo, usuarios(id, nombre, apellido, email, rol, activo, sucursal_id)')
            .eq('id', id)
            .maybeSingle();
        if (error) {
            console.error('Error leyendo la sucursal', error);
            return null;
        }
        if (!data) return null;
        const usuarios = ((data.usuarios ?? []) as unknown as UsuarioEmbed[])
            .map((u) => aUsuario({ ...u, sucursal: null }))
            .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'));
        return { ...aSucursal(data), usuarios };
    } catch (error) {
        console.error('Error leyendo la sucursal', error);
        return null;
    }
}

export async function getUsuariosParaAsignar(): Promise<UsuarioDeSucursal[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nombre, apellido, email, rol, activo, sucursal_id, sucursal:sucursales(nombre)')
            .eq('activo', true)
            .order('apellido');
        if (error) {
            console.error('Error listando usuarios para asignar', error);
            return [];
        }
        return ((data ?? []) as unknown as UsuarioEmbed[]).map(aUsuario);
    } catch (error) {
        console.error('Error listando usuarios para asignar', error);
        return [];
    }
}
