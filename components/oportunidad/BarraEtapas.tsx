import type { EstadoOportunidad } from '@/lib/enums/estadoOportunidad';
import { diasRelativos } from '@/lib/formato';

export interface EtapaBarra {
    id: string;
    nombre: string;
}

interface Props {
    etapas: EtapaBarra[];
    etapaActualId: string;
    diasEnEtapa: number;
    estado: EstadoOportunidad;
    deshabilitada: boolean;
    onSeleccionar: (etapaId: string) => void;
}

const BarraEtapas = ({ etapas, etapaActualId, diasEnEtapa, estado, deshabilitada, onSeleccionar }: Props) => {
    const cerrada = estado !== 'ABIERTA';
    const indiceEncontrado = etapas.findIndex((etapa) => etapa.id === etapaActualId);
    // Cerrada: etapaActualId es la última etapa abierta que recorrió; si no se conoce, se marcan todas.
    const indiceActual = cerrada && indiceEncontrado === -1 ? etapas.length - 1 : indiceEncontrado;

    return (
        <div>
            <div className="overflow-x-auto pb-1 [scrollbar-color:#CFC4D6_transparent] dark:[scrollbar-color:#2A3350_transparent]">
                <ol className="grid min-w-[640px] gap-2" style={{ gridTemplateColumns: `repeat(${etapas.length}, minmax(0, 1fr)) minmax(96px, 0.7fr)` }}>
                    {etapas.map((etapa, i) => {
                        const actual = !cerrada && i === indiceActual;
                        const completada = cerrada ? i <= indiceActual : i < indiceActual;
                        const clase = actual
                            ? 'bg-primary text-white dark:bg-gold dark:text-[#2A1A00]'
                            : completada
                              ? 'bg-[#EDE3EF] text-primary dark:bg-white/10 dark:text-uk-link-dark'
                              : 'border border-dashed border-[#CFC4D6] bg-transparent text-uk-muted dark:border-uk-line-dark dark:text-uk-muted-dark';
                        return (
                            <li key={etapa.id}>
                                <button
                                    type="button"
                                    disabled={deshabilitada || actual}
                                    aria-current={actual ? 'step' : undefined}
                                    onClick={() => onSeleccionar(etapa.id)}
                                    className={`flex min-h-[44px] w-full flex-col items-center justify-center gap-0.5 rounded-[10px] px-2 text-center text-xs font-extrabold focus-visible:ring-2 focus-visible:ring-primary/40 dark:focus-visible:ring-gold/50 ${clase} ${
                                        deshabilitada || actual ? 'cursor-default' : 'hover:brightness-95'
                                    }`}
                                >
                                    <span className="flex items-center gap-1">
                                        {completada ? <span aria-hidden="true">✓</span> : null}
                                        <span className="truncate">{etapa.nombre}</span>
                                    </span>
                                    {actual ? <span className="text-[10px] font-semibold opacity-90">{diasRelativos(-diasEnEtapa)}</span> : null}
                                    <span className="sr-only">{actual ? ' (etapa actual)' : completada ? ' (completada)' : ' (pendiente)'}</span>
                                </button>
                            </li>
                        );
                    })}
                    <li>
                        <div className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-uk-col px-2 text-xs font-extrabold text-uk-muted dark:bg-white/5 dark:text-uk-muted-dark" aria-label="Cierre">
                            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${estado === 'PERDIDA' ? 'bg-uk-muted/40' : 'bg-success'}`} />
                            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${estado === 'GANADA' ? 'bg-uk-muted/40' : 'bg-danger'}`} />
                            {estado === 'GANADA' ? 'Ganada' : estado === 'PERDIDA' ? 'Perdida' : 'Cierre'}
                        </div>
                    </li>
                </ol>
            </div>
            {!cerrada ? (
                <p className="mt-2 text-xs text-uk-muted dark:text-uk-muted-dark">Tocá una etapa para mover la oportunidad. Podés dejar una nota que queda en el historial.</p>
            ) : null}
        </div>
    );
};

export default BarraEtapas;
