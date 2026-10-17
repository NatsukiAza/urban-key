import EtapasConfig from '@/views/Configuracion/EtapasConfig';
import { getEmbudosConfig } from '@/lib/configuracion/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const [sp, config] = await Promise.all([searchParams, getEmbudosConfig()]);
    const funnelActivoId = config.funnels.find((f) => f.id === sp.funnel)?.id ?? config.funnels[0]?.id ?? '';
    return <EtapasConfig key={funnelActivoId} config={config} funnelActivoId={funnelActivoId} />;
}
