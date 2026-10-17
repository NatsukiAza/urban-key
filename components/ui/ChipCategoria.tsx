import type { ReactNode } from 'react';

const ChipCategoria = ({ children, destacado = false }: { children: ReactNode; destacado?: boolean }) => (
    <span
        className={`inline-flex h-6 items-center gap-1 rounded-md bg-uk-col px-2 text-xs text-uk-muted dark:bg-white/5 dark:text-uk-muted-dark ${destacado ? 'font-extrabold' : 'font-bold'}`}
    >
        {children}
    </span>
);

export default ChipCategoria;
