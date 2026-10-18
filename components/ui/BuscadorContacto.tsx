'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import IconSearch from '@/components/Icon/IconSearch';
import { inicialesDe } from '@/components/ui/Iniciales';
import { formatearTelefono } from '@/lib/formato';

export interface ContactoBuscable {
    id: string;
    nombre: string;
    apellido: string;
    email?: string | null;
    telefono?: string | null;
}

interface Props {
    id: string;
    value: string;
    onChange: (id: string) => void;
    contactos: ContactoBuscable[];
    placeholder?: string;
    invalido?: boolean;
    describedBy?: string;
    disabled?: boolean;
    // Si se pasa, la lista cierra con la opción "Crear contacto" y le entrega lo que se escribió.
    onCrear?: (consulta: string) => void;
}

const MAX_RESULTADOS = 8;

const detalleDe = (c: ContactoBuscable) => [c.email, c.telefono ? formatearTelefono(c.telefono) : null].filter(Boolean).join(' · ');

const Resaltado = ({ texto, consulta }: { texto: string; consulta: string }) => {
    const i = consulta ? texto.toLowerCase().indexOf(consulta.toLowerCase()) : -1;
    if (i < 0) return <>{texto}</>;
    return (
        <>
            {texto.slice(0, i)}
            <mark className="bg-transparent font-extrabold text-primary dark:text-uk-link-dark">{texto.slice(i, i + consulta.length)}</mark>
            {texto.slice(i + consulta.length)}
        </>
    );
};

const Avatar = ({ c, chico = false }: { c: ContactoBuscable; chico?: boolean }) => (
    <span className={`grid shrink-0 place-content-center rounded-full bg-primary-light font-extrabold text-primary dark:bg-[#3A2541] dark:text-[#E9D3EE] ${chico ? 'h-[26px] w-[26px] text-[10px]' : 'h-7 w-7 text-[10px]'}`}>{inicialesDe(c.nombre, c.apellido)}</span>
);

// Combobox de búsqueda por nombre, email o teléfono. Con un contacto elegido muestra su ficha y un botón "Cambiar".
const BuscadorContacto = ({ id, value, onChange, contactos, placeholder = 'Buscar por nombre, email o teléfono', invalido = false, describedBy, disabled = false, onCrear }: Props) => {
    const [consulta, setConsulta] = useState('');
    const [abierto, setAbierto] = useState(false);
    const [activo, setActivo] = useState(0);
    const raiz = useRef<HTMLDivElement>(null);
    const entrada = useRef<HTMLInputElement>(null);
    const listaId = useId();

    const elegido = contactos.find((c) => c.id === value);
    const q = consulta.trim().toLowerCase();

    const resultados = useMemo(() => {
        const base = q ? contactos.filter((c) => `${c.nombre} ${c.apellido} ${c.email ?? ''} ${c.telefono ?? ''}`.toLowerCase().includes(q)) : contactos;
        return base.slice(0, MAX_RESULTADOS);
    }, [contactos, q]);

    useEffect(() => {
        if (!abierto) return;
        const fuera = (e: MouseEvent) => {
            if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
        };
        document.addEventListener('mousedown', fuera);
        return () => document.removeEventListener('mousedown', fuera);
    }, [abierto]);

    useEffect(() => setActivo(0), [q]);

    const hayCrear = Boolean(onCrear) && q.length > 0;
    const crear = () => {
        setAbierto(false);
        onCrear?.(consulta.trim());
    };

    const elegir = (c: ContactoBuscable) => {
        onChange(c.id);
        setConsulta('');
        setAbierto(false);
    };

    const cambiar = () => {
        onChange('');
        setAbierto(true);
        setTimeout(() => entrada.current?.focus(), 0);
    };

    const teclado = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAbierto(true);
            setActivo((a) => Math.min(a + 1, resultados.length - (hayCrear ? 0 : 1)));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActivo((a) => Math.max(a - 1, 0));
        } else if (e.key === 'Enter' && abierto && (resultados[activo] || (hayCrear && activo === resultados.length))) {
            e.preventDefault();
            if (resultados[activo]) elegir(resultados[activo]);
            else crear();
        } else if (e.key === 'Escape') setAbierto(false);
    };

    if (elegido) {
        return (
            <div
                id={id}
                tabIndex={-1}
                className={`flex h-[42px] items-center gap-2 rounded-[9px] border bg-uk-page pl-2 pr-1.5 dark:bg-uk-page-dark ${invalido ? 'border-[1.5px] border-uk-lost dark:border-uk-lost-dark' : 'border-uk-field dark:border-uk-field-dark'}`}
            >
                <Avatar c={elegido} chico />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-uk-ink dark:text-uk-ink-dark">
                    {elegido.nombre} {elegido.apellido}
                </span>
                {!disabled ? (
                    <button type="button" onClick={cambiar} className="h-[30px] rounded-[7px] px-2.5 text-[13px] font-extrabold text-primary hover:bg-primary-light dark:text-uk-link-dark dark:hover:bg-white/10">
                        Cambiar
                    </button>
                ) : null}
            </div>
        );
    }

    return (
        <div ref={raiz} className="relative">
            <div
                className={`flex h-[42px] items-center gap-2 rounded-[9px] border bg-white px-3 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15 dark:bg-uk-page-dark dark:focus-within:border-uk-link-dark dark:focus-within:ring-uk-link-dark/20 ${
                    invalido ? 'border-[1.5px] border-uk-lost dark:border-uk-lost-dark' : 'border-uk-field dark:border-uk-field-dark'
                }`}
            >
                <IconSearch className="h-4 w-4 shrink-0 text-uk-muted dark:text-uk-muted-dark" />
                <input
                    ref={entrada}
                    id={id}
                    type="text"
                    role="combobox"
                    aria-expanded={abierto}
                    aria-controls={listaId}
                    aria-autocomplete="list"
                    aria-invalid={invalido || undefined}
                    aria-describedby={describedBy}
                    autoComplete="off"
                    disabled={disabled}
                    value={consulta}
                    placeholder={placeholder}
                    onChange={(e) => {
                        setConsulta(e.target.value);
                        setAbierto(true);
                    }}
                    onFocus={() => setAbierto(true)}
                    onKeyDown={teclado}
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm text-uk-ink outline-none placeholder:text-uk-muted dark:text-uk-ink-dark dark:placeholder:text-uk-muted-dark"
                />
            </div>
            {abierto ? (
                <ul
                    id={listaId}
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-72 overflow-auto rounded-xl border border-uk-line bg-white p-1.5 shadow-[0_16px_32px_rgba(30,15,40,.14)] dark:border-uk-line-dark dark:bg-uk-card-raised-dark dark:shadow-[0_16px_32px_rgba(0,0,0,.5)]"
                >
                    {resultados.length === 0 ? (
                        <li className="px-2.5 py-3 text-sm text-uk-muted dark:text-uk-muted-dark">{q ? `Ningún contacto coincide con “${consulta.trim()}”.` : 'No hay contactos para elegir.'}</li>
                    ) : (
                        resultados.map((c, i) => (
                            <li
                                key={c.id}
                                role="option"
                                aria-selected={i === activo}
                                onMouseEnter={() => setActivo(i)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => elegir(c)}
                                className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 ${i === activo ? 'bg-primary-light dark:bg-white/10' : ''}`}
                            >
                                <Avatar c={c} />
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-bold text-uk-ink dark:text-uk-ink-dark">
                                        <Resaltado texto={`${c.nombre} ${c.apellido}`} consulta={q} />
                                    </span>
                                    {detalleDe(c) ? <span className="truncate text-xs text-uk-muted dark:text-uk-muted-dark">{detalleDe(c)}</span> : null}
                                </span>
                            </li>
                        ))
                    )}
                    {hayCrear ? (
                        <>
                            <li role="separator" className="my-1 h-px bg-uk-line dark:bg-uk-line-dark" />
                            <li
                                role="option"
                                aria-selected={activo === resultados.length}
                                onMouseEnter={() => setActivo(resultados.length)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={crear}
                                className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-extrabold text-primary dark:text-uk-link-dark ${activo === resultados.length ? 'bg-primary-light dark:bg-white/10' : ''}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Crear contacto “{consulta.trim()}”
                            </li>
                        </>
                    ) : null}
                </ul>
            ) : null}
        </div>
    );
};

export default BuscadorContacto;
