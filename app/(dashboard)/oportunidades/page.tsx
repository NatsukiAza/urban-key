import OportunidadesList from '@/views/Oportunidades/OportunidadesList';
import { getOportunidadesList, getFormOptions } from '@/lib/oportunidad/queries';
import type { FiltroOportunidades } from '@/lib/oportunidad/types';
import type { EstadoOportunidad } from '@/lib/enums/estadoOportunidad';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const sp = await searchParams;
    const filtro: FiltroOportunidades = {
        responsableId: sp.responsableId,
        etapaId: sp.etapaId,
        estado: sp.estado as EstadoOportunidad | undefined,
        origenId: sp.origenId,
        funnelId: sp.funnelId,
    };
    const [rows, options] = await Promise.all([getOportunidadesList(filtro), getFormOptions()]);
    return (
        <OportunidadesList
            rows={rows}
            filtro={filtro}
            usuarios={options.usuarios}
            funnels={options.funnels}
            origenes={options.origenes}
            etapas={options.etapas}
            motivosPerdida={options.motivosPerdida}
        />
    );
}
