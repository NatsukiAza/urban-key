import OportunidadBoard from '@/views/Oportunidades/OportunidadBoard';
import { getFunnels, getOportunidadesPorEtapa, getFormOptions } from '@/lib/oportunidad/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const sp = await searchParams;
    const funnels = await getFunnels();
    const activeFunnelId = sp.funnel && funnels.some((f) => f.id === sp.funnel) ? sp.funnel : funnels[0]?.id ?? '';
    const [{ columnas }, options] = await Promise.all([getOportunidadesPorEtapa(activeFunnelId), getFormOptions()]);
    return <OportunidadBoard columnas={columnas} funnels={funnels} activeFunnelId={activeFunnelId} motivosPerdida={options.motivosPerdida} />;
}
