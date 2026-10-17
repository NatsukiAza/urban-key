import type { EstadoOportunidad } from '@/lib/enums/estadoOportunidad';
import type { Moneda } from '@/lib/enums/moneda';
import type { MotivoPerdida } from '@/lib/dominio';
import { modalCerrarGanada, modalCerrarPerdida } from '@/lib/ui/modales';

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
    titulo?: string;
    contacto?: string;
}

// Para etapas abiertas devuelve datos vacíos sin abrir el modal; null si el usuario cancela.
export async function pedirDatosCierre({ resultado, etapaNombre, motivosPerdida, valorEstimado, moneda, titulo, contacto }: Opciones): Promise<DatosCierre | null> {
    if (resultado === 'ABIERTA') return { fechaCierre: null, valorFinal: null, motivoPerdidaId: null, observacion: null };

    const datos = { titulo, contacto, etapaDestino: etapaNombre };

    if (resultado === 'GANADA') {
        const cierre = await modalCerrarGanada({ ...datos, valorEstimado, moneda });
        return cierre && { fechaCierre: cierre.fechaCierre, valorFinal: cierre.valorFinal, motivoPerdidaId: null, observacion: cierre.observacion };
    }

    const cierre = await modalCerrarPerdida({ ...datos, motivos: motivosPerdida });
    return cierre && { fechaCierre: cierre.fechaCierre, valorFinal: null, motivoPerdidaId: cierre.motivoPerdidaId, observacion: cierre.observacion };
}
