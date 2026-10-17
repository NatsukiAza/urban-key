'use client';
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface OpcionSelect {
    value: string;
    label: string;
    detalle?: string;
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    opciones: OpcionSelect[];
    ariaLabel: string;
    id?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    alto?: 'sm' | 'lg';
    invalido?: boolean;
    onClear?: () => void;
    describedBy?: string;
    icono?: ReactNode;
}

const Select = ({ value, onChange, opciones, ariaLabel, id, placeholder = 'Seleccionar', disabled = false, className = '', alto = 'sm', invalido = false, onClear, describedBy, icono }: Props) => {
    const [abierto, setAbierto] = useState(false);
    const [activo, setActivo] = useState(0);
    const raiz = useRef<HTMLDivElement>(null);
    const lista = useRef<HTMLUListElement>(null);
    const listaId = useId();

    const indiceSeleccionado = opciones.findIndex((o) => o.value === value);
    const seleccionada = indiceSeleccionado >= 0 ? opciones[indiceSeleccionado] : undefined;

    useEffect(() => {
        if (!abierto) return;
        const fuera = (event: MouseEvent) => {
            if (raiz.current && !raiz.current.contains(event.target as Node)) setAbierto(false);
        };
        document.addEventListener('mousedown', fuera);
        return () => document.removeEventListener('mousedown', fuera);
    }, [abierto]);

    useEffect(() => {
        if (abierto) lista.current?.querySelector<HTMLElement>(`[data-indice="${activo}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [abierto, activo]);

    const abrir = () => {
        if (disabled) return;
        setActivo(Math.max(indiceSeleccionado, 0));
        setAbierto(true);
    };

    const elegir = (indice: number) => {
        const opcion = opciones[indice];
        if (opcion) onChange(opcion.value);
        setAbierto(false);
    };

    const teclado = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return;
        if (!abierto) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
                event.preventDefault();
                abrir();
            }
            return;
        }
        if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey) {
            const letra = event.key.toLowerCase();
            const siguiente = opciones.findIndex((o, i) => i > activo && o.label.toLowerCase().startsWith(letra));
            const primero = siguiente >= 0 ? siguiente : opciones.findIndex((o) => o.label.toLowerCase().startsWith(letra));
            if (primero >= 0) setActivo(primero);
            return;
        }
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setActivo((i) => Math.min(i + 1, opciones.length - 1));
                break;
            case 'ArrowUp':
                event.preventDefault();
                setActivo((i) => Math.max(i - 1, 0));
                break;
            case 'Home':
                event.preventDefault();
                setActivo(0);
                break;
            case 'End':
                event.preventDefault();
                setActivo(opciones.length - 1);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                elegir(activo);
                break;
            case 'Escape':
                event.preventDefault();
                event.stopPropagation();
                setAbierto(false);
                break;
            case 'Tab':
                setAbierto(false);
                break;
        }
    };

    return (
        <div ref={raiz} className={`relative ${className}`}>
            <button
                type="button"
                id={id}
                role="combobox"
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={abierto}
                aria-controls={listaId}
                aria-invalid={invalido || undefined}
                aria-describedby={describedBy}
                disabled={disabled}
                onClick={() => (abierto ? setAbierto(false) : abrir())}
                onKeyDown={teclado}
                className={`flex w-full items-center justify-between gap-2 rounded-[9px] bg-white px-3 text-left font-semibold text-uk-ink hover:bg-uk-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white dark:bg-uk-page-dark dark:text-uk-ink-dark dark:hover:bg-white/5 dark:focus-visible:ring-gold/50 dark:disabled:hover:bg-uk-page-dark ${
                    alto === 'lg' ? 'h-[42px] text-sm' : 'h-[38px] text-[13px]'
                } ${onClear && value ? 'pr-11' : ''} ${icono ? '!pl-2.5' : ''} ${
                    invalido ? 'border-[1.5px] border-uk-lost dark:border-uk-lost-dark' : 'border border-uk-field dark:border-uk-field-dark'
                }`}
            >
                {icono ? <span className="flex shrink-0 items-center text-uk-muted dark:text-uk-muted-dark">{icono}</span> : null}
                <span className={`flex-1 truncate ${seleccionada ? '' : 'text-uk-muted dark:text-uk-muted-dark'}`}>
                    {seleccionada?.label ?? placeholder}
                    {seleccionada?.detalle ? <span className="ml-1.5 text-xs font-semibold text-uk-muted dark:text-uk-muted-dark">· {seleccionada.detalle}</span> : null}
                </span>
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-uk-muted transition-transform dark:text-uk-muted-dark ${abierto ? 'rotate-180' : ''} ${onClear && value && !disabled ? 'hidden' : ''}`}>
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>
            {onClear && value && !disabled ? (
                <button
                    type="button"
                    aria-label={`Quitar ${ariaLabel.toLowerCase()}`}
                    title={`Quitar ${ariaLabel.toLowerCase()}`}
                    onClick={() => onClear()}
                    className="absolute right-1.5 top-1/2 grid h-[30px] w-[30px] -translate-y-1/2 place-content-center rounded-[7px] text-uk-muted hover:bg-uk-col hover:text-uk-ink dark:text-uk-muted-dark dark:hover:bg-white/10 dark:hover:text-uk-ink-dark"
                >
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                </button>
            ) : null}
            {abierto ? (
                <ul
                    ref={lista}
                    id={listaId}
                    role="listbox"
                    aria-label={ariaLabel}
                    className="absolute left-0 top-full z-40 mt-1.5 max-h-64 w-max min-w-full max-w-[min(320px,calc(100vw-3rem))] overflow-auto rounded-xl border border-uk-line bg-white p-1 shadow-[0_8px_24px_rgba(30,15,40,.16)] [scrollbar-color:#CFC4D6_transparent] dark:border-uk-line-dark dark:bg-uk-card-dark dark:[scrollbar-color:#2A3350_transparent]"
                >
                    {opciones.map((opcion, indice) => {
                        const esSeleccionada = opcion.value === value;
                        return (
                            <li
                                key={opcion.value || `vacio-${indice}`}
                                role="option"
                                aria-selected={esSeleccionada}
                                data-indice={indice}
                                onMouseEnter={() => setActivo(indice)}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => elegir(indice)}
                                className={`flex h-9 cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 text-[13px] ${
                                    esSeleccionada ? 'font-extrabold text-primary dark:text-gold' : 'font-bold text-uk-ink dark:text-uk-ink-dark'
                                } ${indice === activo ? 'bg-primary-light dark:bg-white/10' : ''}`}
                            >
                                <span className="truncate">
                                    {opcion.label}
                                    {opcion.detalle ? <span className="ml-1.5 text-xs font-semibold text-uk-muted dark:text-uk-muted-dark">· {opcion.detalle}</span> : null}
                                </span>
                                {esSeleccionada ? (
                                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                        <path d="m5 12 5 5 9-10" />
                                    </svg>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </div>
    );
};

export default Select;
