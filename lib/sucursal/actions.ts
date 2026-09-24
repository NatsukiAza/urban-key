'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server';
import { getUsuarioActual } from '../auth/session';
import { inmobiliariaSchema, sucursalSchema } from './schema';
import type { ActionResult } from '../types';
import { z } from 'zod';

const fallo = (mensaje: string): ActionResult<never> => ({ ok: false, error: true, mensaje });

const uuid = z.uuid('Identificador inválido');

function mensajeDeError(error: { code?: string; message: string }): string {
    switch (error.code) {
        case '42501':
            return 'No tenés permiso para realizar esta operación';
        case '23503':
            return 'Alguno de los datos relacionados no existe';
        case '23505':
            return 'Ya existe un registro con esos datos';
        case '23514':
            return 'Los datos no cumplen una regla del dominio';
        default:
            return error.message;
    }
}

async function exigirAdmin() {
    const usuario = await getUsuarioActual();
    if (!usuario) return fallo('No hay una sesión activa');
    if (usuario.rol !== 'ADMINISTRADOR') return fallo('Solo un administrador puede gestionar sucursales');
    return null;
}

function revalidar(id?: string) {
    revalidatePath('/sucursales');
    if (id) revalidatePath(`/sucursales/${id}`);
}

export async function crearInmobiliaria(input: unknown): Promise<ActionResult<{ id: string }>> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;

    const parsed = inmobiliariaSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');

    const supabase = await createClient();
    const { count, error: countError } = await supabase.from('inmobiliarias').select('id', { count: 'exact', head: true });
    if (countError) {
        console.error('Error contando inmobiliarias', countError);
        return fallo('No se pudo verificar la inmobiliaria');
    }
    if ((count ?? 0) > 0) return fallo('La inmobiliaria ya está cargada');

    const { data, error } = await supabase.from('inmobiliarias').insert({ nombre: parsed.data.nombre, cuit: parsed.data.cuit }).select('id').single();
    if (error || !data) {
        console.error('Error creando la inmobiliaria', error);
        return fallo(error ? mensajeDeError(error) : 'No se pudo crear la inmobiliaria');
    }

    revalidar();
    return { ok: true, mensaje: 'Inmobiliaria creada correctamente', data: { id: data.id } };
}

export async function actualizarInmobiliaria(id: string, input: unknown): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;
    if (!uuid.safeParse(id).success) return fallo('Identificador inválido');

    const parsed = inmobiliariaSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');

    const supabase = await createClient();
    const { error, count } = await supabase.from('inmobiliarias').update({ nombre: parsed.data.nombre, cuit: parsed.data.cuit }, { count: 'exact' }).eq('id', id);
    if (error) {
        console.error('Error actualizando la inmobiliaria', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('Inmobiliaria no encontrada');

    revalidar();
    return { ok: true, mensaje: 'Inmobiliaria actualizada correctamente' };
}

export async function crearSucursal(input: unknown): Promise<ActionResult<{ id: string }>> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;

    const parsed = sucursalSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');

    const supabase = await createClient();
    const { data: inmobiliaria, error: inmError } = await supabase.from('inmobiliarias').select('id').eq('activo', true).order('creado_en').limit(1).maybeSingle();
    if (inmError) {
        console.error('Error leyendo la inmobiliaria', inmError);
        return fallo('No se pudo verificar la inmobiliaria');
    }
    if (!inmobiliaria) return fallo('Primero cargá la inmobiliaria');

    const { data, error } = await supabase
        .from('sucursales')
        .insert({
            inmobiliaria_id: inmobiliaria.id,
            nombre: parsed.data.nombre,
            direccion: parsed.data.direccion,
            telefono: parsed.data.telefono,
        })
        .select('id')
        .single();

    if (error || !data) {
        console.error('Error creando la sucursal', error);
        return fallo(error ? mensajeDeError(error) : 'No se pudo crear la sucursal');
    }

    revalidar(data.id);
    return { ok: true, mensaje: 'Sucursal creada correctamente', data: { id: data.id } };
}

export async function actualizarSucursal(id: string, input: unknown): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;
    if (!uuid.safeParse(id).success) return fallo('Identificador inválido');

    const parsed = sucursalSchema.safeParse(input);
    if (!parsed.success) return fallo(parsed.error.issues[0]?.message ?? 'Datos inválidos');

    const supabase = await createClient();
    const { error, count } = await supabase
        .from('sucursales')
        .update(
            {
                nombre: parsed.data.nombre,
                direccion: parsed.data.direccion,
                telefono: parsed.data.telefono,
                activo: parsed.data.activo ?? true,
            },
            { count: 'exact' },
        )
        .eq('id', id);

    if (error) {
        console.error('Error actualizando la sucursal', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('Sucursal no encontrada');

    revalidar(id);
    return { ok: true, mensaje: 'Sucursal actualizada correctamente' };
}

export async function asignarUsuarioASucursal(sucursalId: string, usuarioId: string): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;
    if (!uuid.safeParse(sucursalId).success || !uuid.safeParse(usuarioId).success) return fallo('Identificador inválido');

    const supabase = await createClient();
    const { data: sucursal, error: sucError } = await supabase.from('sucursales').select('id, activo').eq('id', sucursalId).maybeSingle();
    if (sucError) {
        console.error('Error leyendo la sucursal', sucError);
        return fallo('No se pudo verificar la sucursal');
    }
    if (!sucursal) return fallo('Sucursal no encontrada');
    if (!sucursal.activo) return fallo('No se pueden asignar usuarios a una sucursal inactiva');

    const { data: usuario, error: usrError } = await supabase.from('usuarios').select('id, activo, sucursal_id').eq('id', usuarioId).maybeSingle();
    if (usrError) {
        console.error('Error leyendo el usuario', usrError);
        return fallo('No se pudo verificar el usuario');
    }
    if (!usuario) return fallo('Usuario no encontrado');
    if (!usuario.activo) return fallo('El usuario está inactivo');
    if (usuario.sucursal_id === sucursalId) return { ok: true, mensaje: 'El usuario ya está en esta sucursal' };

    const { error, count } = await supabase.from('usuarios').update({ sucursal_id: sucursalId }, { count: 'exact' }).eq('id', usuarioId);
    if (error) {
        console.error('Error asignando el usuario', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('No se pudo asignar el usuario');

    revalidar(sucursalId);
    if (usuario.sucursal_id) revalidatePath(`/sucursales/${usuario.sucursal_id}`);
    return { ok: true, mensaje: 'Usuario asignado a la sucursal' };
}

export async function quitarUsuarioDeSucursal(sucursalId: string, usuarioId: string): Promise<ActionResult> {
    const denegado = await exigirAdmin();
    if (denegado) return denegado;
    if (!uuid.safeParse(sucursalId).success || !uuid.safeParse(usuarioId).success) return fallo('Identificador inválido');

    const supabase = await createClient();
    const { error, count } = await supabase.from('usuarios').update({ sucursal_id: null }, { count: 'exact' }).eq('id', usuarioId).eq('sucursal_id', sucursalId);
    if (error) {
        console.error('Error quitando el usuario de la sucursal', error);
        return fallo(mensajeDeError(error));
    }
    if (count === 0) return fallo('El usuario no está en esta sucursal');

    revalidar(sucursalId);
    return { ok: true, mensaje: 'Usuario quitado de la sucursal' };
}
