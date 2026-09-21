import 'server-only';
import { db } from '../mock/store';
import type { Usuario } from '../dominio';

// STUB de sesión. Sin auth real todavía: devuelve un usuario seed fijo.
// Se usa para creado_por / actualizado_por / historial.usuarioId.
// Al integrar Supabase Auth, este es el único archivo que cambia.
export async function getUsuarioActual(): Promise<Usuario | null> {
    return db.usuarios.find((u) => u.rol === 'VENDEDOR') ?? db.usuarios[0] ?? null;
}
