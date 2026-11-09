'use client';
import { useEffect, useId, useRef, useState } from 'react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    id?: string;
    ariaLabel: string;
    invalido?: boolean;
    alto?: 'sm' | 'lg';
    describedBy?: string;
    className?: string;
}

const dos = (n: number) => String(n).padStart(2, '0');
const HORAS = Array.from({ length: 24 }, (_, i) => dos(i));
const MINUTOS = Array.from({ length: 12 }, (_, i) => dos(i * 5));

const ahora = () => {
    const d = new Date();
    return `${dos(d.getHours())}:${dos(d.getMinutes())}`;
};

// "1430" -> "14:30" mientras se escribe.
const mascara = (digitos: string) => {
    const d = digitos.slice(0, 4);
    return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
};

const desdeTexto = (texto: string): string | null => {
    const m = /^(\d{2}):(\d{2})$/.exec(texto);
    return m && Number(m[1]) < 24 && Number(m[2]) < 60 ? texto : null;
};

const TimePicker = ({ value, onChange, id, ariaLabel, invalido = false, alto = 'lg', describedBy, className = '' }: Props) => {
    const [abierto, setAbierto] = useState(false);
    const [arriba, setArriba] = useState(false);
    const [texto, setTexto] = useState(value);
    const raiz = useRef<HTMLDivElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const panelId = useId();
    const [hora, minuto] = value ? value.split(':') : ['', ''];

    const [valorPrevio, setValorPrevio] = useState(value);
    if (value !== valorPrevio) {
        setValorPrevio(value);
        setTexto(value);
    }

    const cerrar = () => {
        setAbierto(false);
        if (texto === '') {
            if (value) onChange('');
        } else if (!desdeTexto(texto)) {
            setTexto(value);
        }
    };

    useEffect(() => {
        if (!abierto) return;
        const fuera = (event: MouseEvent) => {
            if (raiz.current && !raiz.current.contains(event.target as Node)) cerrar();
        };
        document.addEventListener('mousedown', fuera);
        return () => document.removeEventListener('mousedown', fuera);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierto, texto, value]);

    useEffect(() => {
        if (!abierto) return;
        panel.current?.querySelectorAll<HTMLElement>('[aria-pressed="true"]').forEach((el) => {
            const columna = el.parentElement;
            if (columna) columna.scrollTop = el.offsetTop - columna.clientHeight / 2 + el.clientHeight / 2;
        });
    }, [abierto]);

    const abrir = () => {
        if (abierto) return;
        const rect = raiz.current?.getBoundingClientRect();
        setArriba(Boolean(rect && rect.bottom + 280 > window.innerHeight && rect.top > 280));
        setAbierto(true);
    };

    const fijar = (v: string) => {
        onChange(v);
        setTexto(v);
    };

    const escribir = (crudo: string) => {
        const t = mascara(crudo.replace(/\D/g, ''));
        setTexto(t);
        const v = desdeTexto(t);
        if (v) onChange(v);
    };

    const teclado = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && abierto) {
            event.preventDefault();
            event.stopPropagation();
            cerrar();
        }
    };

    const claseOpcion = (elegida: boolean) =>
        `flex h-8 w-full shrink-0 items-center justify-center rounded-[7px] text-[13px] tabular-nums focus-visible:ring-2 focus-visible:ring-primary/40 dark:focus-visible:ring-gold/50 ${
            elegida ? 'bg-primary font-extrabold text-white dark:bg-gold dark:text-[#2A1A00]' : 'font-bold text-uk-ink hover:bg-primary-light dark:text-uk-ink-dark dark:hover:bg-white/10'
        }`;

    const claseColumna = 'relative flex max-h-[200px] flex-col gap-0.5 overflow-y-auto pr-0.5 [scrollbar-color:#CFC4D6_transparent] [scrollbar-width:thin] dark:[scrollbar-color:#2A3350_transparent]';

    return (
        <div
            ref={raiz}
            className={`relative ${className}`}
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
                    aria-label="Abrir selector de hora"
                    aria-haspopup="dialog"
                    aria-expanded={abierto}
                    aria-controls={panelId}
                    onClick={() => (abierto ? cerrar() : abrir())}
                    className="grid h-6 w-6 shrink-0 place-content-center rounded text-uk-muted hover:text-primary dark:text-uk-muted-dark dark:hover:text-uk-link-dark"
                >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                    </svg>
                </button>
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="hh:mm"
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
                        aria-label="Borrar hora"
                        title="Borrar hora"
                        onClick={() => fijar('')}
                        className="grid h-[30px] w-[30px] shrink-0 place-content-center rounded-[7px] text-uk-muted hover:bg-uk-col dark:text-uk-muted-dark dark:hover:bg-white/10"
                    >
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 7l10 10M17 7 7 17" />
                        </svg>
                    </button>
                ) : null}
            </div>

            {abierto ? (
                <div
                    ref={panel}
                    id={panelId}
                    role="dialog"
                    aria-label="Elegir hora"
                    className={`absolute left-0 z-50 flex w-[184px] flex-col gap-1.5 rounded-[14px] border border-uk-line bg-white p-2.5 shadow-[0_16px_36px_rgba(30,15,40,.16)] dark:border-uk-line-dark dark:bg-uk-card-dark dark:shadow-[0_16px_36px_rgba(0,0,0,.5)] ${
                        arriba ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                    }`}
                >
                    <div className="grid grid-cols-2 gap-1.5">
                        <span className="flex h-5 items-center justify-center text-[10px] font-extrabold uppercase text-uk-muted dark:text-uk-muted-dark">Hora</span>
                        <span className="flex h-5 items-center justify-center text-[10px] font-extrabold uppercase text-uk-muted dark:text-uk-muted-dark">Min</span>
                        <div role="group" aria-label="Horas" className={claseColumna}>
                            {HORAS.map((h) => (
                                <button key={h} type="button" aria-label={`${h} horas`} aria-pressed={h === hora} onClick={() => fijar(`${h}:${minuto || '00'}`)} className={claseOpcion(h === hora)}>
                                    {h}
                                </button>
                            ))}
                        </div>
                        <div role="group" aria-label="Minutos" className={claseColumna}>
                            {MINUTOS.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    aria-label={`${m} minutos`}
                                    aria-pressed={m === minuto}
                                    onClick={() => {
                                        fijar(`${hora || '00'}:${m}`);
                                        setAbierto(false);
                                    }}
                                    className={claseOpcion(m === minuto)}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-uk-col pt-1 dark:border-[#232C45]">
                        <button
                            type="button"
                            onClick={() => {
                                fijar(ahora());
                                setAbierto(false);
                            }}
                            className="h-[26px] rounded-[7px] px-1.5 text-xs font-extrabold text-primary hover:bg-primary-light dark:text-uk-link-dark dark:hover:bg-white/10"
                        >
                            Ahora
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                fijar('');
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

export default TimePicker;
