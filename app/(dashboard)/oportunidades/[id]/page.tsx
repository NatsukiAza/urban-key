import { notFound } from 'next/navigation';
import OportunidadDetalle from '@/views/Oportunidades/OportunidadDetalle';
import { getOportunidadDetalle, getFormOptions } from '@/lib/oportunidad/queries';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [detalle, options] = await Promise.all([getOportunidadDetalle(id), getFormOptions()]);
    if (!detalle) notFound();
    const etapasFunnel = options.etapas.filter((e) => e.funnelId === detalle.funnelId).sort((a, b) => a.orden - b.orden);
    return <OportunidadDetalle detalle={detalle} etapasFunnel={etapasFunnel} motivosPerdida={options.motivosPerdida} />;
}
