import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import UsuariosAdmin, { type UsuarioListado } from '@/views/Usuarios/UsuariosAdmin';

export const metadata: Metadata = {
    title: 'Usuarios | UrbanKey',
};

export default async function Page() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('usuarios').select('id, nombre, apellido, email, rol, activo').order('apellido');

    if (error) {
        console.error('Error listando usuarios', error);
    }

    const usuarios: UsuarioListado[] = (data ?? []).map((row) => ({
        id: row.id,
        nombre: row.nombre,
        apellido: row.apellido,
        email: row.email,
        rol: row.rol,
        activo: row.activo,
    }));

    return <UsuariosAdmin usuarios={usuarios} />;
}
