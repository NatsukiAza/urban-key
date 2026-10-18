'use client';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
    // Filtros que se aplican desde el panel en escritorio.
    cantidad: number;
    // En celular el panel también trae los filtros que en escritorio están a la vista.
    cantidadTotal: number;
    children: ReactNode;
    soloMobile?: ReactNode;
}

const MasFiltros = ({ cantidad, cantidadTotal, children, soloMobile }: Props) => {
    const [abierto, setAbierto] = useState(false);
    const raiz = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!abierto) return;
        const fuera = (e: MouseEvent) => {
            if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
        };
        const esc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setAbierto(false);
        };
        document.addEventListener('mousedown', fuera);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('mousedown', fuera);
            document.removeEventListener('keydown', esc);
        };
    }, [abierto]);

    const activo = cantidad > 0;

    return (
        <div ref={raiz} className="relative">
            <button
                type="button"
                aria-expanded={abierto}
                aria-haspopup="dialog"
                onClick={() => setAbierto((v) => !v)}
                className={`inline-flex h-[38px] items-center rounded-[9px] border px-3 text-[13px] font-bold ${
                    activo || cantidadTotal > 0
                        ? `${activo ? '' : 'sm:border-uk-field sm:bg-white sm:text-uk-ink sm:hover:bg-uk-col dark:sm:border-uk-field-dark dark:sm:bg-uk-page-dark dark:sm:text-uk-ink-dark dark:sm:hover:bg-white/5'} border-primary bg-primary-light text-primary dark:border-uk-link-dark dark:bg-uk-link-dark/10 dark:text-uk-link-dark`
                        : 'border-uk-field bg-white text-uk-ink hover:bg-uk-col dark:border-uk-field-dark dark:bg-uk-page-dark dark:text-uk-ink-dark dark:hover:bg-white/5'
                }`}
            >
                <span className="hidden sm:inline">Más filtros{cantidad > 0 ? ` (${cantidad})` : ''}</span>
                <span className="sm:hidden">Filtros{cantidadTotal > 0 ? ` (${cantidadTotal})` : ''}</span>
            </button>
            {abierto ? (
                <div
                    role="dialog"
                    aria-label="Más filtros"
                    className="absolute left-0 top-full z-30 mt-2 flex w-[min(320px,calc(100vw-3rem))] flex-col gap-3 rounded-xl border border-uk-line bg-white p-4 shadow-[0_8px_24px_rgba(30,15,40,.16)] dark:border-uk-line-dark dark:bg-uk-card-dark sm:left-auto sm:right-0"
                >
                    {soloMobile ? <div className="flex flex-col gap-3 sm:hidden">{soloMobile}</div> : null}
                    {children}
                </div>
            ) : null}
        </div>
    );
};

export default MasFiltros;
