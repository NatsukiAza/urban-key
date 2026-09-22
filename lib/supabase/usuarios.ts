import type { SupabaseClient } from '@supabase/supabase-js';

export type RolUsuario = 'ADMINISTRADOR' | 'VENDEDOR' | 'RESPONSABLE_COMERCIAL';

export type Usuario = {
    id: string;
    sucursal_id: string | null;
    nombre: string;
    apellido: string;
    email: string;
    rol: RolUsuario;
    activo: boolean;
};

export const rolLabel: Record<RolUsuario, string> = {
    ADMINISTRADOR: 'Administrador',
    VENDEDOR: 'Vendedor',
    RESPONSABLE_COMERCIAL: 'Responsable comercial',
};

const USUARIO_COLUMNS = 'id, sucursal_id, nombre, apellido, email, rol, activo';

export function nombreCompleto(usuario: Pick<Usuario, 'nombre' | 'apellido'>) {
    return `${usuario.nombre} ${usuario.apellido}`.trim();
}

/**
 * El alta de Auth dispara el trigger que ya existe en el proyecto y crea la fila
 * en public.usuarios. El cliente no puede insertar: RLS no tiene política de insert.
 * Si el trigger dejó nombre o apellido vacíos, se completan con la metadata del registro.
 */
export async function syncUsuarioProfile(supabase: SupabaseClient): Promise<{ profile: Usuario } | { error: string }> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return { error: 'No hay una sesión activa.' };
    }

    const { data: profile, error } = await supabase.from('usuarios').select(USUARIO_COLUMNS).eq('id', user.id).maybeSingle();

    if (error) {
        return { error: 'No se pudo leer el perfil de usuario.' };
    }

    if (!profile) {
        return { error: 'Tu acceso existe, pero no hay un perfil en usuarios.' };
    }

    if (!profile.activo) {
        return { error: 'Tu usuario está inactivo.' };
    }

    const metadata = user.user_metadata ?? {};
    const nombreMeta = typeof metadata.nombre === 'string' ? metadata.nombre.trim() : '';
    const apellidoMeta = typeof metadata.apellido === 'string' ? metadata.apellido.trim() : '';
    const patch: { nombre?: string; apellido?: string; email?: string } = {};

    if (!profile.nombre.trim() && nombreMeta) {
        patch.nombre = nombreMeta;
    }
    if (!profile.apellido.trim() && apellidoMeta) {
        patch.apellido = apellidoMeta;
    }
    if (user.email && profile.email !== user.email) {
        patch.email = user.email;
    }

    if (Object.keys(patch).length === 0) {
        return { profile };
    }

    const { data: updated, error: updateError } = await supabase.from('usuarios').update(patch).eq('id', user.id).select(USUARIO_COLUMNS).single();

    if (updateError || !updated) {
        return { profile };
    }

    return { profile: updated };
}
