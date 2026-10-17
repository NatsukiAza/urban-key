'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
    id?: string;
    ariaLabel: string;
    invalido?: boolean;
    alto?: 'sm' | 'lg';
    describedBy?: string;
    mostrarAyuda?: boolean;
    className?: string;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const dos = (n: number) => String(n).padStart(2, '0');

const aIso = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const deIso = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};
const formatear = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');

// "30112026" -> "30/11/2026" mientras se escribe.
const mascara = (digitos: string) => {
    const d = digitos.slice(0, 8);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

const desdeTexto = (texto: string): string | null => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return d.getFullYear() === Number(m[3]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[1]) ? aIso(d) : null;
};

const ayudaRelativa = (iso: string, hoy: string) => {
    if (!iso) return 'Sin fecha elegida';
    const diff = Math.round((deIso(iso).getTime() - deIso(hoy).getTime()) / 86_400_000);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    if (diff === -1) return 'Ayer';
    return diff > 0 ? `En ${diff} días` : `Hace ${-diff} días`;
};

const DatePicker = ({ value, onChange, min, max, id, ariaLabel, invalido = false, alto = 'lg', describedBy, mostrarAyuda = true, className = '' }: Props) => {
    const hoy = useMemo(() => aIso(new Date()), []);
    const base = value ? deIso(value) : deIso(hoy);
    const [abierto, setAbierto] = useState(false);
    const [arriba, setArriba] = useState(false);
    const [mes, setMes] = useState({ y: base.getFullYear(), m: base.getMonth() });
    const [texto, setTexto] = useState(formatear(value));
    const raiz = useRef<HTMLDivElement>(null);
    const dialogoId = useId();

    useEffect(() => {
        setTexto(formatear(value));
        if (value) {
            const d = deIso(value);
            setMes({ y: d.getFullYear(), m: d.getMonth() });
        }
    }, [value]);

    useEffect(() => {
        if (!abierto) return;
        const fuera = (event: MouseEvent) => {
            if (raiz.current && !raiz.current.contains(event.target as Node)) cerrar();
        };
        document.addEventListener('mousedown', fuera);
        return () => document.removeEventListener('mousedown', fuera);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierto, texto, value, min, max]);

    const cerrar = () => {
        setAbierto(false);
        const valido = desdeTexto(texto);
        if (texto === '') {
            if (value) onChange('');
        } else if (!valido || (min && valido < min) || (max && valido > max)) {
            setTexto(formatear(value));
        }
    };

    const abrir = () => {
        if (abierto) return;
        const rect = raiz.current?.getBoundingClientRect();
        setArriba(Boolean(rect && rect.bottom + 340 > window.innerHeight && rect.top > 340));
        setAbierto(true);
    };

    const permitido = (iso: string) => (!min || iso >= min) && (!max || iso <= max);

    const elegir = (iso: string) => {
        onChange(iso);
        setTexto(formatear(iso));
        setAbierto(false);
    };

    const escribir = (crudo: string) => {
        const t = mascara(crudo.replace(/\D/g, ''));
        setTexto(t);
        const iso = desdeTexto(t);
        if (iso && permitido(iso)) onChange(iso);
    };

    const celdas = useMemo(() => {
        const primero = new Date(mes.y, mes.m, 1);
        const offset = (primero.getDay() + 6) % 7;
        return Array.from({ length: 42 }, (_, i) => {
            const d = new Date(mes.y, mes.m, 1 - offset + i);
            return { iso: aIso(d), dia: d.getDate(), delMes: d.getMonth() === mes.m, texto: `${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}` };
        });
    }, [mes]);

    const mover = (delta: number) =>
        setMes(({ y, m }) => {
            const n = new Date(y, m + delta, 1);
            return { y: n.getFullYear(), m: n.getMonth() };
        });

    const teclado = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && abierto) {
            event.preventDefault();
            event.stopPropagation();
            cerrar();
        }
    };

    return (
        <div
            ref={raiz}
            className={`relative flex flex-col gap-1.5 ${className}`}
            onKeyDown={teclado}
            onBlur={(event) => {
                if (abierto && !event.currentTarget.contains(event.relatedTarget as Node | null)) cerrar();
            }}
        >
            <div
                className={`flex items-center gap-2 rounded-[9px] bg-white pl-3 pr-1.5 dark:bg-uk-page-dark ${alto === 'lg' ? 'h-[42px]' : 'h-[38px]'} ${
                    invalido
                        ? 'border-[1.5px] border-uk-lost dark:border-uk-lost-dark'
                        : abierto
                          ? 'border-[1.5px] border-primary shadow-[0_0_0_3px_rgba(80,37,88,.12)] dark:border-uk-link-dark dark:shadow-[0_0_0_3px_rgba(215,184,222,.16)]'
                          : 'border border-uk-field focus-within:border-[1.5px] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(80,37,88,.12)] dark:border-uk-field-dark dark:focus-within:border-uk-link-dark dark:focus-within:shadow-[0_0_0_3px_rgba(215,184,222,.16)]'
                }`}
            >
                <button
                    type="button"
                    aria-label="Abrir calendario"
                    aria-haspopup="dialog"
                    aria-expanded={abierto}
                    aria-controls={dialogoId}
                    onClick={() => (abierto ? cerrar() : abrir())}
                    className="grid h-6 w-6 shrink-0 place-content-center rounded text-uk-muted hover:text-primary dark:text-uk-muted-dark dark:hover:text-uk-link-dark"
                >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M3 10h18M8 3v4M16 3v4" />
                    </svg>
                </button>
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="dd/mm/aaaa"
                    aria-label={ariaLabel}
                    aria-invalid={invalido || undefined}
                    aria-describedby={describedBy}
                    value={texto}
                    onFocus={abrir}
                    onClick={abrir}
                    onChange={(e) => escribir(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-bold tabular-nums text-uk-ink outline-none ring-0 placeholder:font-semibold placeholder:text-[#8E91A6] focus:ring-0 dark:text-uk-ink-dark dark:placeholder:text-[#6E7593]"
                />
                {value ? (
                    <button
                        type="button"
                        aria-label="Borrar fecha"
                        title="Borrar fecha"
                        onClick={() => {
                            onChange('');
                            setTexto('');
                        }}
                        className="grid h-[30px] w-[30px] shrink-0 place-content-center rounded-[7px] text-uk-muted hover:bg-uk-col dark:text-uk-muted-dark dark:hover:bg-white/10"
                    >
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 7l10 10M17 7 7 17" />
                        </svg>
                    </button>
                ) : null}
            </div>
            {mostrarAyuda ? <p className="text-xs font-semibold text-uk-muted dark:text-uk-muted-dark">{ayudaRelativa(value, hoy)}</p> : null}

            {abierto ? (
                <div
                    id={dialogoId}
                    role="dialog"
                    aria-label="Elegir fecha"
                    className={`absolute left-0 z-50 flex w-[260px] flex-col gap-1.5 rounded-[14px] border border-uk-line bg-white p-2.5 shadow-[0_16px_36px_rgba(30,15,40,.16)] dark:border-uk-line-dark dark:bg-uk-card-dark dark:shadow-[0_16px_36px_rgba(0,0,0,.5)] ${
                        arriba ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <button type="button" aria-label="Mes anterior" onClick={() => mover(-1)} className="grid h-7 w-7 place-content-center rounded-[9px] border border-uk-line bg-white text-primary hover:bg-uk-col dark:border-uk-line-dark dark:bg-transparent dark:text-uk-link-dark dark:hover:bg-white/5">
                            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 6-6 6 6 6" />
                            </svg>
                        </button>
                        <span aria-live="polite" className="text-[13px] font-extrabold text-uk-ink dark:text-uk-ink-dark">
                            {MESES[mes.m]} {mes.y}
                        </span>
                        <button type="button" aria-label="Mes siguiente" onClick={() => mover(1)} className="grid h-7 w-7 place-content-center rounded-[9px] border border-uk-line bg-white text-primary hover:bg-uk-col dark:border-uk-line-dark dark:bg-transparent dark:text-uk-link-dark dark:hover:bg-white/5">
                            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m9 6 6 6-6 6" />
                            </svg>
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                        {DIAS.map((d, i) => (
                            <span key={i} className="flex h-5 items-center justify-center text-[10px] font-extrabold text-uk-muted dark:text-uk-muted-dark">
                                {d}
                            </span>
                        ))}
                        {celdas.map((c) => {
                            const elegida = c.iso === value;
                            const esHoy = c.iso === hoy;
                            const ok = permitido(c.iso);
                            const clase = elegida
                                ? 'bg-primary font-extrabold text-white dark:bg-gold dark:text-[#2A1A00]'
                                : !ok
                                  ? 'cursor-not-allowed font-semibold text-[#C3C5D3] dark:text-[#4A5373]'
                                  : esHoy
                                    ? 'border-[1.5px] border-primary bg-white font-extrabold text-primary hover:bg-primary-light dark:border-uk-link-dark dark:bg-transparent dark:text-uk-link-dark dark:hover:bg-white/5'
                                    : !c.delMes
                                      ? 'font-semibold text-[#8E91A6] hover:bg-uk-col dark:text-[#6E7593] dark:hover:bg-white/5'
                                      : 'font-bold text-uk-ink hover:bg-primary-light dark:text-uk-ink-dark dark:hover:bg-white/10';
                            return (
                                <button
                                    key={c.iso}
                                    type="button"
                                    aria-label={`${c.texto}${ok ? '' : ', no disponible'}`}
                                    aria-pressed={elegida}
                                    disabled={!ok}
                                    onClick={() => elegir(c.iso)}
                                    className={`flex h-[30px] items-center justify-center rounded-[7px] text-xs tabular-nums focus-visible:ring-2 focus-visible:ring-primary/40 dark:focus-visible:ring-gold/50 ${clase}`}
                                >
                                    {c.dia}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between border-t border-uk-col pt-1 text-[11px] text-uk-muted dark:border-[#232C45] dark:text-uk-muted-dark">
                        <span>O escribí dd/mm/aaaa</span>
                        <button
                            type="button"
                            onClick={() => {
                                onChange('');
                                setTexto('');
                                setAbierto(false);
                            }}
                            className="h-[26px] rounded-[7px] px-1.5 text-xs font-extrabold text-primary hover:bg-primary-light dark:text-uk-link-dark dark:hover:bg-white/10"
                        >
                            Borrar
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default DatePicker;
