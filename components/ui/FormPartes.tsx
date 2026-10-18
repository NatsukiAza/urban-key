'use client';
import type { ReactNode } from 'react';

export const claseInput = 'form-input h-[42px] w-full rounded-[9px] text-sm dark:!bg-uk-page-dark dark:!border-uk-field-dark dark:!text-uk-ink-dark';
export const claseTextarea = 'form-textarea w-full resize-y rounded-[9px] text-sm dark:!border-uk-field-dark dark:!bg-uk-page-dark dark:!text-uk-ink-dark';
export const claseInvalido = '!border-[1.5px] !border-uk-lost dark:!border-uk-lost-dark';

export const formatearMiles = (digitos: string) => (digitos ? Number(digitos).toLocaleString('es-AR') : '');

export const Obligatorio = () => (
    <>
        <span aria-hidden="true" className="ml-0.5 text-uk-lost dark:text-uk-lost-dark">
            *
        </span>
        <span className="sr-only"> (obligatorio)</span>
    </>
);

interface CampoProps {
    id: string;
    etiqueta: string;
    obligatorio?: boolean;
    error?: string;
    ayuda?: string;
    className?: string;
    children: ReactNode;
}

export const Campo = ({ id, etiqueta, obligatorio, error, ayuda, className = '', children }: CampoProps) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label htmlFor={id} className="!mb-0 text-[13px] font-bold text-uk-ink dark:text-uk-ink-dark">
            {etiqueta}
            {obligatorio ? <Obligatorio /> : null}
        </label>
        {children}
        {error ? (
            <p id={`${id}-error`} className="text-xs font-bold text-uk-lost dark:text-uk-lost-dark">
                {error}
            </p>
        ) : ayuda ? (
            <p className="text-xs font-semibold text-uk-muted dark:text-uk-muted-dark">{ayuda}</p>
        ) : null}
    </div>
);

// Igual que Campo pero para grupos de botones: la etiqueta no apunta a un input.
export const CampoGrupo = ({ id, etiqueta, obligatorio, ayuda, className = '', children }: { id: string; etiqueta: string; obligatorio?: boolean; ayuda?: string; className?: string; children: ReactNode }) => (
    <div role="group" aria-labelledby={id} className={`flex flex-col gap-1.5 ${className}`}>
        <span id={id} className="text-[13px] font-bold text-uk-ink dark:text-uk-ink-dark">
            {etiqueta}
            {obligatorio ? <Obligatorio /> : null}
        </span>
        {children}
        {ayuda ? <p className="text-xs font-semibold text-uk-muted dark:text-uk-muted-dark">{ayuda}</p> : null}
    </div>
);

export const Bloque = ({ titulo, ayuda, ultimo = false, columnas = 2, children }: { titulo: string; ayuda?: string; ultimo?: boolean; columnas?: 1 | 2 | 3; children: ReactNode }) => (
    <fieldset className={`m-0 flex min-w-0 flex-wrap gap-6 border-0 p-6 ${ultimo ? '' : 'border-b border-b-uk-col dark:border-b-[#232C45]'}`}>
        <legend className="sr-only">{titulo}</legend>
        <div className="flex max-w-[240px] flex-[1_1_200px] flex-col gap-1">
            <h2 className="text-base font-extrabold text-uk-ink dark:text-uk-ink-dark">{titulo}</h2>
            {ayuda ? <p className="text-[13px] leading-normal text-uk-muted dark:text-uk-muted-dark">{ayuda}</p> : null}
        </div>
        <div className={`grid min-w-0 flex-[999_1_420px] grid-cols-1 gap-5 ${columnas === 3 ? 'sm:grid-cols-2 md:grid-cols-3' : columnas === 2 ? 'md:grid-cols-2' : ''}`}>{children}</div>
    </fieldset>
);

export const FormularioTarjeta = ({ onSubmit, children }: { onSubmit: (e: React.FormEvent) => void; children: ReactNode }) => (
    <form onSubmit={onSubmit} noValidate className="flex flex-col rounded-[14px] border border-uk-line bg-white shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:border-[#232C45] dark:bg-uk-card-dark dark:shadow-none">
        {children}
    </form>
);

export const PieFormulario = ({ children }: { children: ReactNode }) => (
    <div className="z-10 flex flex-wrap justify-end gap-2 rounded-b-[14px] border-t border-uk-line bg-[#FBFAFC] px-6 py-4 dark:border-[#232C45] dark:bg-[#121A2C] max-md:sticky max-md:bottom-0 max-md:rounded-none">{children}</div>
);

interface OpcionGrupo<T extends string> {
    value: T;
    label: string;
}

const claseEstadoPildora = (activa: boolean) =>
    activa
        ? 'border-[1.5px] border-primary bg-primary-light font-extrabold text-primary dark:border-uk-link-dark dark:bg-uk-link-dark/10 dark:text-uk-link-dark'
        : 'border border-uk-field bg-white font-bold text-uk-ink hover:bg-uk-col dark:border-uk-field-dark dark:bg-uk-page-dark dark:text-uk-ink-dark dark:hover:bg-white/5';

// Opción múltiple en forma de píldoras: cada una se marca o desmarca por separado.
export const PildorasMultiples = ({ opciones, activas, onToggle }: { opciones: OpcionGrupo<string>[]; activas: string[]; onToggle: (value: string) => void }) => (
    <div className="flex flex-wrap gap-1.5">
        {opciones.map((o) => {
            const activa = activas.includes(o.value);
            return (
                <button key={o.value} type="button" role="checkbox" aria-checked={activa} onClick={() => onToggle(o.value)} className={`h-9 rounded-full px-3.5 text-[13px] ${claseEstadoPildora(activa)}`}>
                    {o.label}
                </button>
            );
        })}
    </div>
);

// Una sola opción a la vez, como segmentos dentro de una barra.
export const Segmentado = <T extends string>({ opciones, value, onChange, etiqueta, grande = false }: { opciones: OpcionGrupo<T>[]; value: T; onChange: (value: T) => void; etiqueta: string; grande?: boolean }) => (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex flex-wrap self-start rounded-[10px] bg-[#EDE8F1] p-1 dark:bg-white/5">
        {opciones.map((o) => {
            const activa = o.value === value;
            return (
                <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={activa}
                    onClick={() => onChange(o.value)}
                    className={`rounded-[7px] ${grande ? 'h-[34px] px-[22px] text-sm' : 'h-8 px-3.5 text-[13px]'} ${
                        activa ? 'bg-white font-extrabold text-primary shadow-[0_1px_2px_rgba(30,15,40,.12)] dark:bg-uk-link-dark/15 dark:text-uk-link-dark dark:shadow-none' : 'font-bold text-uk-muted hover:text-uk-ink dark:text-uk-muted-dark dark:hover:text-uk-ink-dark'
                    }`}
                >
                    {o.label}
                </button>
            );
        })}
    </div>
);

export const TarjetasOpcion = <T extends string>({ opciones, value, onChange, etiqueta }: { opciones: (OpcionGrupo<T> & { icono: ReactNode })[]; value: T; onChange: (value: T) => void; etiqueta: string }) => (
    <div role="radiogroup" aria-label={etiqueta} className="grid grid-cols-3 gap-2">
        {opciones.map((o) => {
            const activa = o.value === value;
            return (
                <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={activa}
                    onClick={() => onChange(o.value)}
                    className={`flex h-[72px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-[10px] px-1 text-xs sm:text-[13px] ${claseEstadoPildora(activa)}`}
                >
                    <span className={activa ? '' : 'text-uk-muted dark:text-uk-muted-dark'}>{o.icono}</span>
                    {o.label}
                </button>
            );
        })}
    </div>
);

const claseBotonStepper = 'grid w-[42px] shrink-0 place-content-center bg-uk-page text-lg font-extrabold text-primary hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/5 dark:text-uk-link-dark dark:hover:bg-white/10';

export const Stepper = ({ id, value, onChange, min, etiqueta, invalido = false, describedBy }: { id: string; value: string; onChange: (value: string) => void; min: number; etiqueta: string; invalido?: boolean; describedBy?: string }) => {
    const numero = value === '' ? null : Number(value);
    return (
        <div className={`flex h-[42px] overflow-hidden rounded-[9px] border ${invalido ? 'border-[1.5px] border-uk-lost dark:border-uk-lost-dark' : 'border-uk-field dark:border-uk-field-dark'}`}>
            <button type="button" aria-label={`Restar ${etiqueta}`} disabled={numero == null || numero <= min} onClick={() => onChange(numero == null || numero <= min ? '' : String(numero - 1))} className={`${claseBotonStepper} border-r border-uk-field dark:border-uk-field-dark`}>
                −
            </button>
            <input
                id={id}
                type="text"
                inputMode="numeric"
                value={value}
                placeholder="—"
                aria-invalid={invalido || undefined}
                aria-describedby={describedBy}
                onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="min-w-0 flex-1 border-0 bg-transparent text-center text-[15px] font-extrabold tabular-nums text-uk-ink outline-none placeholder:font-normal dark:bg-uk-page-dark dark:text-uk-ink-dark"
            />
            <button type="button" aria-label={`Sumar ${etiqueta}`} onClick={() => onChange(String(numero == null ? min : numero + 1))} className={`${claseBotonStepper} border-l border-uk-field dark:border-uk-field-dark`}>
                +
            </button>
        </div>
    );
};

// Campo de texto con un prefijo y/o sufijo fijo (código de país, unidad, moneda).
export const CampoConAdorno = ({ prefijo, sufijo, children, invalido = false }: { prefijo?: ReactNode; sufijo?: ReactNode; children: ReactNode; invalido?: boolean }) => (
    <div className={`flex h-[42px] overflow-hidden rounded-[9px] border focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15 dark:focus-within:border-uk-link-dark dark:focus-within:ring-uk-link-dark/20 ${invalido ? 'border-[1.5px] border-uk-lost dark:border-uk-lost-dark' : 'border-uk-field dark:border-uk-field-dark'}`}>
        {prefijo ? <span className="flex items-center border-r border-uk-field bg-uk-page px-2.5 text-[13px] font-bold text-uk-muted dark:border-uk-field-dark dark:bg-white/5 dark:text-uk-muted-dark">{prefijo}</span> : null}
        {children}
        {sufijo ? <span className="flex items-center border-l border-uk-field bg-uk-page px-3 text-[13px] font-bold text-uk-muted dark:border-uk-field-dark dark:bg-white/5 dark:text-uk-muted-dark">{sufijo}</span> : null}
    </div>
);

export const claseInputAdorno = 'min-w-0 flex-1 border-0 bg-transparent px-3 text-[15px] font-extrabold tabular-nums text-uk-ink outline-none placeholder:font-normal dark:bg-uk-page-dark dark:text-uk-ink-dark';
