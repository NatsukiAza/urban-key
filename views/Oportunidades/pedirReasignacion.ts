import type { Usuario } from '@/lib/dominio';
import { modalReasignar } from '@/lib/ui/modales';

// Devuelve el id del nuevo responsable, o null si se cancela.
export async function pedirReasignacion(usuarios: Pick<Usuario, 'id' | 'nombre' | 'apellido'>[], responsableActualId: string): Promise<string | null> {
    return modalReasignar({ usuarios, responsableActualId });
}
