'use client';
import IconX from '@/components/Icon/IconX';

export interface ChipFiltro {
    clave: string;
    etiqueta: string;
    texto: string;
}

interface Props {
    chips: ChipFiltro[];
    onQuitar: (clave: string) => void;
    onLimpiar: () => void;
}

const ChipsFiltros = ({ chips, onQuitar, onLimpiar }: Props) => {
    if (chips.length === 0) return null;
    return (
        <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
                <span key={chip.clave} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary-light pl-2.5 pr-1 text-xs font-bold text-primary dark:bg-uk-link-dark/[.12] dark:text-uk-link-dark">
                    {chip.etiqueta}: {chip.texto}
                    <button
                        type="button"
                        aria-label={`Quitar filtro ${chip.etiqueta}`}
                        title={`Quitar filtro ${chip.etiqueta}`}
                        onClick={() => onQuitar(chip.clave)}
                        className="grid h-[22px] w-[22px] place-content-center rounded-full hover:bg-primary/10 dark:hover:bg-white/10"
                    >
                        <IconX className="h-3 w-3" />
                    </button>
                </span>
            ))}
            <button type="button" onClick={onLimpiar} className="text-xs font-extrabold text-primary underline hover:no-underline dark:text-uk-link-dark">
                Limpiar filtros
            </button>
        </div>
    );
};

export default ChipsFiltros;
