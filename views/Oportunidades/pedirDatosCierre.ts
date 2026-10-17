import Swal from 'sweetalert2';
import type { EstadoOportunidad } from '@/lib/enums/estadoOportunidad';
import type { Moneda } from '@/lib/enums/moneda';
import type { MotivoPerdida } from '@/lib/dominio';

export interface DatosCierre {
    fechaCierre: string | null;
    valorFinal: number | null;
    motivoPerdidaId: string | null;
    observacion: string | null;
}

interface Opciones {
    resultado: EstadoOportunidad;
    etapaNombre: string;
    motivosPerdida: MotivoPerdida[];
    valorEstimado: number | null;
    moneda: Moneda;
}

const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const hoyLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Para etapas abiertas devuelve datos vacíos sin abrir el modal; null si el usuario cancela.
export async function pedirDatosCierre({ resultado, etapaNombre, motivosPerdida, valorEstimado, moneda }: Opciones): Promise<DatosCierre | null> {
    if (resultado === 'ABIERTA') return { fechaCierre: null, valorFinal: null, motivoPerdidaId: null, observacion: null };

    const ganada = resultado === 'GANADA';
    const hoy = hoyLocal();
    const valorRequerido = valorEstimado != null;

    const campoEspecifico = ganada
        ? `<label for="cierre-valor" class="block text-left mb-1">Valor final (${moneda})${valorRequerido ? ' *' : ''}</label>
           <input id="cierre-valor" type="number" min="0" step="0.01" class="form-input mb-4" value="${valorEstimado ?? ''}" />`
        : `<label for="cierre-motivo" class="block text-left mb-1">Motivo de pérdida *</label>
           <select id="cierre-motivo" class="form-select mb-4">
               <option value="">Seleccionar motivo…</option>
               ${motivosPerdida.map((m) => `<option value="${m.id}">${escapar(m.nombre)}</option>`).join('')}
           </select>`;

    const { value, isConfirmed } = await Swal.fire<DatosCierre>({
        title: ganada ? 'Cerrar como ganada' : 'Cerrar como perdida',
        html: `<p class="mb-4 text-sm">La oportunidad pasa a “${escapar(etapaNombre)}” y queda cerrada.</p>
               <label for="cierre-fecha" class="block text-left mb-1">Fecha de cierre *</label>
               <input id="cierre-fecha" type="date" class="form-input mb-4" value="${hoy}" max="${hoy}" />
               ${campoEspecifico}
               <label for="cierre-obs" class="block text-left mb-1">Observación</label>
               <textarea id="cierre-obs" class="form-textarea" rows="2"></textarea>`,
        showCancelButton: true,
        confirmButtonText: 'Confirmar cierre',
        cancelButtonText: 'Cancelar',
        focusConfirm: false,
        padding: '2em',
        preConfirm: () => {
            const popup = Swal.getPopup()!;
            const fechaCierre = (popup.querySelector('#cierre-fecha') as HTMLInputElement).value;
            const observacion = (popup.querySelector('#cierre-obs') as HTMLTextAreaElement).value.trim() || null;
            if (!fechaCierre) return Swal.showValidationMessage('Indicá la fecha de cierre');
            if (fechaCierre > hoy) return Swal.showValidationMessage('La fecha de cierre no puede ser futura');

            if (ganada) {
                const crudo = (popup.querySelector('#cierre-valor') as HTMLInputElement).value;
                if (valorRequerido && crudo === '') return Swal.showValidationMessage('Indicá el valor final');
                const valorFinal = crudo === '' ? null : Number(crudo);
                if (valorFinal != null && valorFinal < 0) return Swal.showValidationMessage('El valor final no puede ser negativo');
                return { fechaCierre, valorFinal, motivoPerdidaId: null, observacion };
            }

            const motivoPerdidaId = (popup.querySelector('#cierre-motivo') as HTMLSelectElement).value;
            if (!motivoPerdidaId) return Swal.showValidationMessage('Elegí un motivo de pérdida');
            return { fechaCierre, valorFinal: null, motivoPerdidaId, observacion };
        },
    });

    return isConfirmed && value ? value : null;
}
