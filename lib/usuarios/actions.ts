'use server';

import { revalidatePath } from 'next/cache';
import type { RolUsuario } from '../enums/rolUsuario';
import { getUsuarioActual } from '../auth/session';
import { createClient } from '../supabase/server';
import { createServiceClient } from '../supabase/admin';
import type { ActionResult } from '../types';

const ROLES: RolUsuario[] = ['ADMINISTRADOR', 'VENDEDOR', 'RESPONSABLE_COMERCIAL'];

const fallo = (mensaje: string): ActionResult<never> => ({ ok: false, error: true, mensaje });

function correoValido(correo: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export async function registroDisponible(): Promise<boolean> {
    try {
        const admin = createServiceClient();
        const { count, error } = await admin.from('inmobiliarias').select('id', { count: 'exact', head: true });
        if (error) return false;
        return (count ?? 0) === 0;
    } catch {
        return false;
    }
}

export async function registrarInmobiliaria(input: {
    inmobiliaria: string;
    nombre: string;
    apellido: string;
    correo: string;
    password: string;
}): Promise<ActionResult> {
    const inmobiliaria = input.inmobiliaria.trim();
    const nombre = input.nombre.trim();
    const apellido = input.apellido.trim();
    const correo = input.correo.trim().toLowerCase();

    if (!inmobiliaria) return fallo('El nombre de la inmobiliaria es obligatorio.');
    if (!nombre || !apellido) return fallo('Nombre y apellido son obligatorios.');
    if (!correoValido(correo)) return fallo('El correo no es válido.');
    if (input.password.length < 6) return fallo('La contraseña tiene que tener al menos 6 caracteres.');

    let admin;
    try {
        admin = createServiceClient();
    } catch {
        return fallo('El registro no está configurado en el servidor.');
    }

    const { count, error: countError } = await admin.from('inmobiliarias').select('id', { count: 'exact', head: true });
    if (countError) return fallo('No se pudo verificar si ya hay una inmobiliaria.');
    if ((count ?? 0) > 0) return fallo('Ya hay una inmobiliaria. Pedile al administrador que te cree el usuario.');

    const { data: creado, error: createError } = await admin.auth.admin.createUser({
        email: correo,
        password: input.password,
        email_confirm: true,
        user_metadata: { nombre, apellido },
    });

    if (createError || !creado.user) {
        const yaExiste = createError?.message.toLowerCase().includes('already') || createError?.code === 'email_exists';
        return fallo(yaExiste ? 'Ya existe una cuenta con ese correo.' : 'No se pudo crear la cuenta. Revisá los datos e intentá de nuevo.');
    }

    const { error: vinculoError } = await admin.rpc('vincular_inmobiliaria_inicial', {
        p_usuario_id: creado.user.id,
        p_nombre: inmobiliaria,
    });

    if (vinculoError) {
        await admin.auth.admin.deleteUser(creado.user.id);
        const yaHay = vinculoError.message.toLowerCase().includes('ya existe');
        return fallo(yaHay ? 'Ya hay una inmobiliaria. Pedile al administrador que te cree el usuario.' : 'No se pudo crear la inmobiliaria.');
    }

    return { ok: true };
}

export async function crearEmpleado(input: {
    nombre: string;
    apellido: string;
    correo: string;
    rol: string;
    password: string;
}): Promise<ActionResult<{ contrasenaTemporal: string }>> {
    const actual = await getUsuarioActual();
    if (!actual || actual.rol !== 'ADMINISTRADOR') return fallo('Solo un administrador puede crear usuarios.');

    const nombre = input.nombre.trim();
    const apellido = input.apellido.trim();
    const correo = input.correo.trim().toLowerCase();
    const rol = input.rol as RolUsuario;

    if (!nombre || !apellido) return fallo('Nombre y apellido son obligatorios.');
    if (!correoValido(correo)) return fallo('El correo no es válido.');
    if (!ROLES.includes(rol)) return fallo('El rol no es válido.');
    if (input.password.length < 6) return fallo('La contraseña temporal tiene que tener al menos 6 caracteres.');

    let admin;
    try {
        admin = createServiceClient();
    } catch {
        return fallo('El alta de usuarios no está configurada en el servidor.');
    }

    const { data: sucursal, error: sucursalError } = await admin.from('sucursales').select('id').eq('activo', true).order('creado_en').limit(1).maybeSingle();
    if (sucursalError || !sucursal) return fallo('No hay una sucursal para asignar el usuario.');

    const { data: creado, error: createError } = await admin.auth.admin.createUser({
        email: correo,
        password: input.password,
        email_confirm: true,
        user_metadata: { nombre, apellido },
    });

    if (createError || !creado.user) {
        const yaExiste = createError?.message.toLowerCase().includes('already') || createError?.code === 'email_exists';
        return fallo(yaExiste ? 'Ya existe una cuenta con ese correo.' : 'No se pudo crear el usuario.');
    }

    const { error: updateError } = await admin
        .from('usuarios')
        .update({
            rol,
            sucursal_id: sucursal.id,
            debe_cambiar_contrasena: true,
            nombre,
            apellido,
            email: correo,
        })
        .eq('id', creado.user.id);

    if (updateError) {
        await admin.auth.admin.deleteUser(creado.user.id);
        return fallo('No se pudo asignar el rol del usuario.');
    }

    revalidatePath('/usuarios');
    return { ok: true, data: { contrasenaTemporal: input.password } };
}

export async function cambiarContrasena(password: string): Promise<ActionResult> {
    if (password.length < 6) return fallo('La contraseña tiene que tener al menos 6 caracteres.');

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fallo('No hay una sesión activa.');

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) return fallo('No se pudo cambiar la contraseña.');

    let admin;
    try {
        admin = createServiceClient();
    } catch {
        return fallo('No se pudo confirmar el cambio de contraseña.');
    }

    const { error: flagError } = await admin.rpc('confirmar_contrasena_cambiada', { p_usuario_id: user.id });
    if (flagError) return fallo('La contraseña se cambió, pero no se pudo habilitar el acceso. Intentá de nuevo.');

    return { ok: true };
}
