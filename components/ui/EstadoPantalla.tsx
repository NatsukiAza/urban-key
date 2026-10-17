import type { ReactNode } from 'react';

interface Props {
    variante: 'vacio' | 'error';
    icono: ReactNode;
    titulo: string;
    descripcion: ReactNode;
    acciones?: ReactNode;
}

const EstadoPantalla = ({ variante, icono, titulo, descripcion, acciones }: Props) => (
    <div role={variante === 'error' ? 'alert' : 'status'} className="flex min-h-[260px] flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-uk-col px-6 py-12 text-center dark:border dark:border-[#1E2740] dark:bg-uk-col-dark">
        <span
            aria-hidden="true"
            className={`grid h-14 w-14 place-content-center rounded-full ${
                variante === 'error' ? 'bg-[#FDECEE] text-uk-lost dark:bg-danger/15 dark:text-uk-lost-dark' : 'bg-primary-light text-primary dark:bg-white/10 dark:text-uk-link-dark'
            }`}
        >
            {icono}
        </span>
        <h2 className="text-lg font-extrabold text-uk-ink dark:text-uk-ink-dark">{titulo}</h2>
        <p className="max-w-md text-sm text-uk-muted dark:text-uk-muted-dark">{descripcion}</p>
        {acciones ? <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{acciones}</div> : null}
    </div>
);

export default EstadoPantalla;
