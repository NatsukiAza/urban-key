import 'server-only';
import { createClient } from '../supabase/server';
import { aUsuario } from '../mapeo';
import type { Usuario } from '../dominio';

export async function getUsuarioActual(): Promise<Usuario | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from('usuarios').select('*').eq('id', user.id).maybeSingle();

    if (error) {
        console.error('Error resolviendo el usuario actual', error);
        return null;
    }
    if (!data) {
        console.error(`El usuario ${user.id} no tiene fila en public.usuarios`);
        return null;
    }

    return aUsuario(data);
}
