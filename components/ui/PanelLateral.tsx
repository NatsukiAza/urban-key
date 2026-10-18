'use client';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import IconX from '@/components/Icon/IconX';

interface Props {
    abierto: boolean;
    onCerrar: () => void;
    titulo?: string;
    descripcion?: string;
    // Sin encabezado propio (solo la X) para pantallas de resultado.
    sinEncabezado?: boolean;
    pie?: ReactNode;
    children: ReactNode;
}

const SELECTOR_FOCO = 'input:not([type=hidden]):not([disabled]), button:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex="-1"])';

// Panel que entra por la derecha sobre un velo. Se cierra con Esc o clic en el velo; el foco queda dentro mientras está abierto.
const PanelLateral = ({ abierto, onCerrar, titulo, descripcion, sinEncabezado = false, pie, children }: Props) => {
    const panel = useRef<HTMLElement>(null);
    const anterior = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!abierto) return;
        anterior.current = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const t = setTimeout(() => panel.current?.querySelector<HTMLElement>('[data-foco-inicial], input:not([type=hidden]):not([disabled])')?.focus(), 0);

        const teclado = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCerrar();
                return;
            }
            if (e.key !== 'Tab' || !panel.current) return;
            const foco = [...panel.current.querySelectorAll<HTMLElement>(SELECTOR_FOCO)].filter((el) => el.offsetParent !== null);
            if (foco.length === 0) return;
            const primero = foco[0];
            const ultimo = foco[foco.length - 1];
            if (e.shiftKey && document.activeElement === primero) {
                e.preventDefault();
                ultimo.focus();
            } else if (!e.shiftKey && document.activeElement === ultimo) {
                e.preventDefault();
                primero.focus();
            }
        };
        document.addEventListener('keydown', teclado);
        return () => {
            clearTimeout(t);
            document.removeEventListener('keydown', teclado);
            document.body.style.overflow = overflow;
            anterior.current?.focus?.();
        };
    }, [abierto, onCerrar]);

    if (!abierto) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            <div aria-hidden="true" onClick={onCerrar} className="absolute inset-0 bg-[rgba(27,20,36,.38)]" />
            <aside
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                className="absolute bottom-0 right-0 top-0 flex w-[440px] max-w-full flex-col bg-white shadow-[-16px_0_40px_rgba(30,15,40,.2)] dark:border-l dark:border-uk-line-dark dark:bg-uk-card-dark dark:shadow-[-16px_0_40px_rgba(0,0,0,.5)]"
            >
                <div className={`flex items-start gap-3 border-b border-uk-line px-6 py-5 dark:border-[#232C45] ${sinEncabezado ? 'justify-end' : 'justify-between'}`}>
                    {!sinEncabezado ? (
                        <div className="flex flex-col gap-1">
                            <h2 className="text-xl font-extrabold text-uk-ink dark:text-uk-ink-dark">{titulo}</h2>
                            {descripcion ? <p className="text-[13px] text-uk-muted dark:text-uk-muted-dark">{descripcion}</p> : null}
                        </div>
                    ) : null}
                    <button type="button" aria-label="Cerrar" onClick={onCerrar} className="grid h-9 w-9 shrink-0 place-content-center rounded-[9px] text-uk-muted hover:bg-uk-col dark:text-uk-muted-dark dark:hover:bg-white/5">
                        <IconX className="h-[18px] w-[18px]" />
                    </button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
                {pie ? <div className="flex flex-wrap justify-end gap-2 border-t border-uk-line px-6 py-4 dark:border-[#232C45]">{pie}</div> : null}
            </aside>
        </div>
    );
};

export default PanelLateral;
