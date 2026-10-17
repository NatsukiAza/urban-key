import { notFound } from 'next/navigation';
import OportunidadDetalle from '@/views/Oportunidades/OportunidadDetalle';
import { getOportunidadDetalle, getFormOptions } from '@/lib/oportunidad/queries';
import { getUsuarioActual } from '@/lib/auth/session';
import { puedeReasignar } from '@/lib/auth/permisos';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [detalle, options, usuario] = await Promise.all([getOportunidadDetalle(id), getFormOptions(), getUsuarioActual()]);
    if (!detalle) notFound();
    // getFormOptions trae solo etapas activas; si la actual se desactivó, se suma para que el select la muestre.
    const activas = options.etapas.filter((e) => e.funnelId === detalle.funnelId);
    const etapasFunnel = (detalle.etapa && !activas.some((e) => e.id === detalle.etapaId) ? [...activas, detalle.etapa] : activas).sort((a, b) => a.orden - b.orden);
    return (
        <OportunidadDetalle
            detalle={detalle}
            etapasFunnel={etapasFunnel}
            motivosPerdida={options.motivosPerdida}
            usuarios={options.usuarios}
            puedeReasignar={puedeReasignar(usuario?.rol)}
        />
    );
}
