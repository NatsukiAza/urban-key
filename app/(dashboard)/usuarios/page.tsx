import type { Metadata } from 'next';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUsuarioActual } from '@/lib/auth/session';
import UsuariosAdmin, { type UsuarioListado } from '@/views/Usuarios/UsuariosAdmin';

export const metadata: Metadata = {
    title: 'Usuarios | UrbanKey',
};

export default async function Page() {
    await connection();
    const supabase = await createClient();
    const actual = await getUsuarioActual();
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

    return <UsuariosAdmin usuarios={usuarios} usuarioActualId={actual?.id} />;
}
