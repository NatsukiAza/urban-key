import Swal from 'sweetalert2';
import type { Usuario } from '@/lib/dominio';

// Devuelve el id del nuevo responsable, o null si se cancela.
export async function pedirReasignacion(usuarios: Usuario[], responsableActualId: string): Promise<string | null> {
    const opciones = usuarios.filter((u) => u.id !== responsableActualId).reduce((acc: Record<string, string>, u) => ({ ...acc, [u.id]: `${u.nombre} ${u.apellido}` }), {});
    const { value, isConfirmed } = await Swal.fire({
        title: 'Reasignar responsable',
        input: 'select',
        inputOptions: opciones,
        inputPlaceholder: 'Seleccionar responsable',
        showCancelButton: true,
        confirmButtonText: 'Reasignar',
        cancelButtonText: 'Cancelar',
        padding: '2em',
        inputValidator: (v) => (!v ? 'Tenés que elegir un responsable' : undefined),
    });
    return isConfirmed ? (value as string) : null;
}
