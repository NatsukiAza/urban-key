import OportunidadBoard from '@/views/Oportunidades/OportunidadBoard';
import { getFunnels, getFunnelConMasOportunidades, getOportunidadesPorEtapa, getFormOptions } from '@/lib/oportunidad/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const sp = await searchParams;
    const [funnels, funnelConMas] = await Promise.all([getFunnels(), getFunnelConMasOportunidades()]);
    const pedido = sp.funnel && funnels.some((f) => f.id === sp.funnel) ? sp.funnel : null;
    const sugerido = funnelConMas && funnels.some((f) => f.id === funnelConMas) ? funnelConMas : null;
    const activeFunnelId = pedido ?? sugerido ?? funnels[0]?.id ?? '';
    const [{ columnas }, options] = await Promise.all([getOportunidadesPorEtapa(activeFunnelId), getFormOptions()]);
    return <OportunidadBoard columnas={columnas} funnels={funnels} activeFunnelId={activeFunnelId} motivosPerdida={options.motivosPerdida} />;
}
