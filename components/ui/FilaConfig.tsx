'use client';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';
import IconHorizontalDots from '@/components/Icon/IconHorizontalDots';
import IconPencil from '@/components/Icon/IconPencil';

const claseFila = 'relative flex min-h-[56px] items-center gap-1 rounded-[10px] border border-uk-line bg-white pr-2 dark:border-uk-line-dark dark:bg-transparent';
const claseBotonPrimario = 'h-[38px] rounded-lg bg-primary px-3.5 text-[13px] font-extrabold text-white hover:brightness-110 disabled:opacity-60 dark:bg-gold dark:text-[#2A1A00]';

export interface AccionDesactivar {
    descripcion: string;
    deshabilitado?: boolean;
    onClick: () => void;
}

interface MenuProps {
    nombre: string;
    onRenombrar: () => void;
    desactivar?: AccionDesactivar;
}

const MenuFila = ({ nombre, onRenombrar, desactivar }: MenuProps) => {
    const [abierto, setAbierto] = useState(false);
    const raiz = useRef<HTMLDivElement>(null);
    const primero = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!abierto) return;
        primero.current?.focus();
        const fuera = (e: MouseEvent) => {
            if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
        };
        document.addEventListener('mousedown', fuera);
        return () => document.removeEventListener('mousedown', fuera);
    }, [abierto]);

    const teclado = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            setAbierto(false);
        }
    };

    const itemBase = 'flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2.5 text-left text-uk-ink hover:bg-uk-page dark:text-uk-ink-dark dark:hover:bg-white/10';

    return (
        <div ref={raiz} onKeyDown={teclado}>
            <button
                type="button"
                aria-label={`Acciones de ${nombre}`}
                aria-haspopup="menu"
                aria-expanded={abierto}
                onClick={() => setAbierto((v) => !v)}
                className={`grid h-10 w-10 place-content-center rounded-[9px] border ${
                    abierto
                        ? 'border-primary bg-primary-light text-primary dark:border-uk-link-dark dark:bg-uk-link-dark/10 dark:text-uk-link-dark'
                        : 'border-uk-line bg-white text-uk-muted hover:bg-uk-col dark:border-uk-line-dark dark:bg-transparent dark:text-uk-muted-dark dark:hover:bg-white/5'
                }`}
            >
                <IconHorizontalDots className="h-4 w-4" />
            </button>
            {abierto ? (
                <>
                    <div aria-hidden="true" className="fixed inset-0 z-[60] bg-black/40 md:hidden" onClick={() => setAbierto(false)} />
                    <div
                        role="menu"
                        className="fixed inset-x-0 bottom-0 z-[61] rounded-t-2xl border border-uk-line bg-white p-3 pb-6 shadow-[0_-8px_32px_rgba(30,15,40,.25)] dark:border-uk-line-dark dark:bg-uk-card-raised-dark md:absolute md:inset-x-auto md:bottom-auto md:right-2 md:top-[52px] md:w-[260px] md:rounded-xl md:p-1.5 md:pb-1.5 md:shadow-[0_8px_24px_rgba(30,15,40,.16)] md:dark:shadow-[0_16px_32px_rgba(0,0,0,.5)]"
                    >
                        <p className="mb-1 truncate px-2.5 text-xs font-bold text-uk-muted dark:text-uk-muted-dark md:hidden">{nombre}</p>
                        <button
                            ref={primero}
                            type="button"
                            role="menuitem"
                            className={`${itemBase} text-[13px] font-bold`}
                            onClick={() => {
                                setAbierto(false);
                                onRenombrar();
                            }}
                        >
                            Renombrar
                        </button>
                        {desactivar ? (
                            <>
                                <span role="separator" className="my-1 block h-px bg-uk-line dark:bg-uk-line-dark" />
                                <button
                                    type="button"
                                    role="menuitem"
                                    aria-disabled={desactivar.deshabilitado || undefined}
                                    onClick={() => {
                                        if (desactivar.deshabilitado) return;
                                        setAbierto(false);
                                        desactivar.onClick();
                                    }}
                                    className={`${itemBase} ${desactivar.deshabilitado ? 'cursor-not-allowed opacity-60 hover:bg-transparent dark:hover:bg-transparent' : ''}`}
                                >
                                    <span className="text-[13px] font-bold">Desactivar…</span>
                                    <span className="text-xs font-normal leading-snug text-uk-muted dark:text-uk-muted-dark">{desactivar.descripcion}</span>
                                </button>
                            </>
                        ) : null}
                    </div>
                </>
            ) : null}
        </div>
    );
};

interface CampoNombreProps {
    inicial: string;
    existentes: string[];
    mensajeDuplicado: string;
    etiqueta: string;
    placeholder?: string;
    confirmar: string;
    onConfirmar: (nombre: string) => Promise<string | null>;
    onCancelar: () => void;
    izquierda?: ReactNode;
}

// Campo de nombre en la fila (renombrar y alta): Enter guarda, Esc cancela, errores debajo.
const FilaEditable = ({ inicial, existentes, mensajeDuplicado, etiqueta, placeholder, confirmar, onConfirmar, onCancelar, izquierda }: CampoNombreProps) => {
    const [texto, setTexto] = useState(inicial);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        input.current?.focus();
        input.current?.select();
    }, []);

    const guardar = async () => {
        const nombre = texto.trim();
        if (!nombre) return setError('Escribí un nombre.');
        if (nombre.toLowerCase() === inicial.trim().toLowerCase() && inicial) return onCancelar();
        if (existentes.some((n) => n.trim().toLowerCase() === nombre.toLowerCase())) return setError(mensajeDuplicado);
        setGuardando(true);
        const falla = await onConfirmar(nombre);
        setGuardando(false);
        if (falla) setError(falla);
    };

    const teclas = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            void guardar();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onCancelar();
        }
    };

    return (
        <li className="relative flex min-h-[56px] flex-wrap items-start gap-2 rounded-[10px] border-[1.5px] border-primary bg-primary-light/40 py-2 pl-1 pr-2 dark:border-uk-link-dark dark:bg-uk-link-dark/5">
            {izquierda ? <div className="flex h-[38px] items-center">{izquierda}</div> : null}
            <label className="flex min-w-[220px] flex-1 flex-col gap-1 pl-2">
                <span className="sr-only">{etiqueta}</span>
                <input
                    ref={input}
                    type="text"
                    value={texto}
                    maxLength={60}
                    placeholder={placeholder}
                    aria-invalid={Boolean(error) || undefined}
                    onChange={(e) => {
                        setTexto(e.target.value);
                        setError('');
                    }}
                    onKeyDown={teclas}
                    className={`h-[38px] rounded-lg border bg-white px-2.5 text-[15px] font-bold text-uk-ink outline-none dark:bg-uk-page-dark dark:text-uk-ink-dark ${
                        error ? 'border-[1.5px] border-uk-lost dark:border-uk-lost-dark' : 'border-primary dark:border-uk-link-dark'
                    }`}
                />
                {error ? <span className="text-xs font-bold text-uk-lost dark:text-uk-lost-dark">{error}</span> : <span className="text-[11px] text-uk-muted dark:text-uk-muted-dark">Enter para guardar · Esc para cancelar</span>}
            </label>
            <button type="button" aria-label="Cancelar" title="Cancelar (Esc)" onClick={onCancelar} className="grid h-[38px] w-9 shrink-0 place-content-center rounded-lg text-uk-muted hover:bg-uk-col dark:text-uk-muted-dark dark:hover:bg-white/10">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 6l12 12M18 6 6 18" />
                </svg>
            </button>
            <button type="button" onClick={() => void guardar()} disabled={guardando} className={claseBotonPrimario}>
                {guardando ? 'Guardando…' : confirmar}
            </button>
        </li>
    );
};

interface FilaConfigProps {
    nombre: string;
    existentes: string[];
    mensajeDuplicado: string;
    onGuardar: (nombre: string) => Promise<string | null>;
    izquierda?: ReactNode;
    antes?: ReactNode;
    derecha?: ReactNode;
    desactivar?: AccionDesactivar;
    // Sin menú: botón lápiz que entra en modo renombrar (etapas de cierre).
    soloLapiz?: boolean;
    ocupado?: boolean;
    sinMenu?: boolean;
}

export const FilaConfig = ({ nombre, existentes, mensajeDuplicado, onGuardar, izquierda, antes, derecha, desactivar, soloLapiz = false, ocupado = false, sinMenu = false }: FilaConfigProps) => {
    const [editando, setEditando] = useState(false);

    if (editando) {
        return (
            <FilaEditable
                inicial={nombre}
                existentes={existentes}
                mensajeDuplicado={mensajeDuplicado}
                etiqueta={`Nombre de ${nombre}`}
                confirmar="Guardar"
                izquierda={izquierda}
                onCancelar={() => setEditando(false)}
                onConfirmar={async (n) => {
                    const falla = await onGuardar(n);
                    if (!falla) setEditando(false);
                    return falla;
                }}
            />
        );
    }

    return (
        <li className={`${claseFila} ${izquierda ? 'pl-0.5' : 'pl-3'}`}>
            {izquierda}
            {antes ? <span className="pl-1">{antes}</span> : null}
            <button
                type="button"
                title="Renombrar"
                disabled={ocupado}
                onClick={() => setEditando(true)}
                className="min-w-0 flex-1 cursor-text truncate rounded px-1.5 py-2 text-left text-[15px] font-bold text-uk-ink hover:bg-uk-page dark:text-uk-ink-dark dark:hover:bg-white/5"
            >
                {nombre}
            </button>
            {derecha}
            {soloLapiz ? (
                <button
                    type="button"
                    aria-label={`Renombrar ${nombre}`}
                    title="Renombrar"
                    disabled={ocupado}
                    onClick={() => setEditando(true)}
                    className="grid h-10 w-10 place-content-center rounded-[9px] border border-uk-line bg-white text-uk-muted hover:bg-uk-col dark:border-uk-line-dark dark:bg-transparent dark:text-uk-muted-dark dark:hover:bg-white/5"
                >
                    <IconPencil className="h-4 w-4" />
                </button>
            ) : sinMenu ? null : (
                <MenuFila nombre={nombre} onRenombrar={() => setEditando(true)} desactivar={desactivar} />
            )}
        </li>
    );
};

interface FilaAltaProps {
    placeholder: string;
    existentes: string[];
    mensajeDuplicado: string;
    onAgregar: (nombre: string) => Promise<string | null>;
    onCancelar: () => void;
}

export const FilaAlta = ({ placeholder, existentes, mensajeDuplicado, onAgregar, onCancelar }: FilaAltaProps) => (
    <FilaEditable inicial="" existentes={existentes} mensajeDuplicado={mensajeDuplicado} etiqueta="Nombre del nuevo motivo" placeholder={placeholder} confirmar="Agregar" onConfirmar={onAgregar} onCancelar={onCancelar} />
);

export const FilaInactiva = ({ nombre, onActivar, ocupado = false }: { nombre: string; onActivar: () => void; ocupado?: boolean }) => (
    <li className="flex min-h-[52px] items-center gap-3 rounded-[10px] border border-dashed border-uk-field bg-uk-page py-0 pl-4 pr-2 dark:border-uk-field-dark dark:bg-white/[.02]">
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-uk-muted dark:text-uk-muted-dark">{nombre}</span>
        <button
            type="button"
            disabled={ocupado}
            onClick={onActivar}
            className="h-9 rounded-[9px] border border-primary bg-white px-3.5 text-[13px] font-extrabold text-primary hover:bg-primary-light disabled:opacity-60 dark:border-uk-link-dark dark:bg-transparent dark:text-uk-link-dark dark:hover:bg-white/5"
        >
            Activar
        </button>
    </li>
);
