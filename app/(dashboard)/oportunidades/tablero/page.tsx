import { getUsuarioActual } from '@/lib/auth/session';
import OportunidadBoard from '@/views/Oportunidades/OportunidadBoard';
import { getFunnels, getFunnelConMasOportunidades, getOportunidadesPorEtapa, getFormOptions, getConteoAbiertasPorFunnel } from '@/lib/oportunidad/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const sp = await searchParams;
    const [funnels, funnelConMas, conteoFunnels, usuario] = await Promise.all([getFunnels(), getFunnelConMasOportunidades(), getConteoAbiertasPorFunnel(), getUsuarioActual()]);
    const pedido = sp.funnel && funnels.some((f) => f.id === sp.funnel) ? sp.funnel : null;
    const sugerido = funnelConMas && funnels.some((f) => f.id === funnelConMas) ? funnelConMas : null;
    const activeFunnelId = pedido ?? sugerido ?? funnels[0]?.id ?? '';
    const [{ columnas, error }, options] = await Promise.all([getOportunidadesPorEtapa(activeFunnelId), getFormOptions()]);
    return <OportunidadBoard columnas={columnas} funnels={funnels} activeFunnelId={activeFunnelId} conteoFunnels={conteoFunnels} hayError={error} usuarioId={usuario?.id ?? ''} puedeFiltrarResponsable={usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'RESPONSABLE_COMERCIAL'} motivosPerdida={options.motivosPerdida} />;
}
