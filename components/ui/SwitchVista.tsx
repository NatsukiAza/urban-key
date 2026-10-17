import Link from 'next/link';

const base = 'inline-flex h-9 items-center rounded-lg px-3 text-sm font-bold';
const inactivo = `${base} text-uk-muted hover:text-uk-ink dark:text-uk-muted-dark dark:hover:text-uk-ink-dark`;
const activo = `${base} bg-white font-extrabold text-primary shadow-[0_1px_2px_rgba(30,15,40,.06)] dark:bg-uk-line-dark dark:text-white dark:shadow-none`;

const SwitchVista = ({ vista }: { vista: 'lista' | 'tablero' }) => (
    <div role="group" aria-label="Vista" className="inline-flex rounded-[10px] bg-uk-col p-1 dark:border dark:border-[#232C45] dark:bg-uk-card-dark">
        {vista === 'lista' ? (
            <span aria-current="page" className={activo}>
                Lista
            </span>
        ) : (
            <Link href="/oportunidades" className={inactivo}>
                Lista
            </Link>
        )}
        {vista === 'tablero' ? (
            <span aria-current="page" className={activo}>
                Tablero
            </span>
        ) : (
            <Link href="/oportunidades/tablero" className={inactivo}>
                Tablero
            </Link>
        )}
    </div>
);

export default SwitchVista;
