import { connection } from 'next/server';
import EtapasConfig from '@/views/Configuracion/EtapasConfig';
import { getEmbudosConfig } from '@/lib/configuracion/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    // Las consultas arrancan en paralelo con searchParams y tragan el error de lectura de sesión durante el build.
    await connection();
    const [sp, config] = await Promise.all([searchParams, getEmbudosConfig()]);
    const funnelActivoId = config.funnels.find((f) => f.id === sp.funnel)?.id ?? config.funnels[0]?.id ?? '';
    return <EtapasConfig key={funnelActivoId} config={config} funnelActivoId={funnelActivoId} />;
}
