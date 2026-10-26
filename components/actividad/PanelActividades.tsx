'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { ActividadDetalle, VinculoActividad } from '@/lib/actividad/types';
import { formatearFechaHora } from '@/lib/formato';
import { Tarjeta } from '@/components/ui/FichaPartes';
import { useActividades } from './useActividades';

interface Props {
    vinculo: VinculoActividad;
    subtitulo: string;
    mostrarOportunidad?: boolean;
}

export const claseAccion = 'text-[13px] font-extrabold text-primary hover:underline disabled:opacity-60 dark:text-uk-link-dark';

export const POR_PAGINA = 10;

export const VerMas = ({ restantes, onClick }: { restantes: number; onClick: () => void }) =>
    restantes > 0 ? (
        <button type="button" onClick={onClick} className="btn btn-outline-primary h-10 w-full rounded-[10px] text-[13px] font-extrabold shadow-none dark:border-uk-field-dark dark:text-uk-ink-dark">
            Ver {Math.min(restantes, POR_PAGINA)} más <span className="ml-1 font-semibold text-uk-muted dark:text-uk-muted-dark">({restantes === 1 ? 'queda 1' : `quedan ${restantes}`})</span>
        </button>
    ) : null;

interface ItemProps {
    actividad: ActividadDetalle;
    mostrarOportunidad: boolean;
    ultimo: boolean;
    ocupado: boolean;
    onDarDeBaja: () => void;
}

export const ItemActividad = ({ actividad, mostrarOportunidad, ultimo, ocupado, onDarDeBaja }: ItemProps) => (
    <li className={`relative pb-6 pl-7 last:pb-0 ${actividad.activo ? '' : 'opacity-70'}`}>
        {!ultimo ? <span aria-hidden="true" className="absolute bottom-0 left-[6px] top-5 w-0.5 bg-primary/25 dark:bg-white/15" /> : null}
        <span aria-hidden="true" className="absolute left-[1.5px] top-[4.5px] h-[11px] w-[11px] rounded-full bg-[#CDB8D3] dark:bg-white/30" />
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <p className="min-w-0 text-sm text-uk-ink dark:text-uk-ink-dark">
                <strong className="font-extrabold">{actividad.tipo}</strong>
                {actividad.titulo !== actividad.tipo ? <span className="font-semibold"> · {actividad.titulo}</span> : null}
            </p>
            {actividad.puedeDarDeBaja ? (
                <button type="button" disabled={ocupado} onClick={onDarDeBaja} className="text-xs font-bold text-uk-lost hover:underline disabled:opacity-60 dark:text-uk-lost-dark">
                    Dar de baja
                </button>
            ) : null}
        </div>
        <p className="mt-1 text-xs text-uk-muted dark:text-uk-muted-dark">
            <span className="tabular-nums">{formatearFechaHora(actividad.fecha)}</span> · {actividad.autor}
            {mostrarOportunidad && actividad.oportunidad ? (
                <>
                    {' · en '}
                    <Link href={`/oportunidades/${actividad.oportunidad.id}`} className="font-bold text-primary hover:underline dark:text-uk-link-dark">
                        {actividad.oportunidad.titulo}
                    </Link>
                </>
            ) : null}
        </p>
        {actividad.descripcion ? <p className="mt-2 whitespace-pre-line rounded-lg bg-uk-page px-3 py-2.5 text-sm leading-[1.5] text-uk-ink dark:bg-uk-page-dark dark:text-uk-ink-dark">{actividad.descripcion}</p> : null}
        {!actividad.activo ? (
            <p className="mt-2 inline-flex h-6 items-center rounded-md bg-uk-col px-2 text-xs font-bold text-uk-muted dark:bg-white/5 dark:text-uk-muted-dark">
                Dada de baja{actividad.dadaDeBajaEn ? ` el ${formatearFechaHora(actividad.dadaDeBajaEn)}` : ''}
                {actividad.dadaDeBajaPor ? ` por ${actividad.dadaDeBajaPor}` : ''}
            </p>
        ) : null}
    </li>
);

const PanelActividades = ({ vinculo, subtitulo, mostrarOportunidad = false }: Props) => {
    const { datos, error, ocupado, cargar, registrar, darDeBaja } = useActividades(vinculo, subtitulo);
    const [verBajas, setVerBajas] = useState(false);
    const [limite, setLimite] = useState(POR_PAGINA);

    const activas = datos?.actividades.filter((a) => a.activo) ?? [];
    const bajas = datos?.actividades.filter((a) => !a.activo) ?? [];
    const todas = verBajas ? (datos?.actividades ?? []) : activas;
    const visibles = todas.slice(0, limite);

    return (
        <Tarjeta
            titulo="Actividades"
            derecha={
                <div className="flex items-center gap-4">
                    {datos ? <span className="text-[13px] tabular-nums text-uk-muted dark:text-uk-muted-dark">{activas.length === 1 ? '1 registrada' : `${activas.length} registradas`}</span> : null}
                    <button type="button" className={claseAccion} disabled={!datos || ocupado} onClick={() => void registrar()}>
                        + Registrar actividad
                    </button>
                </div>
            }
        >
            {error ? (
                <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-bold text-uk-lost dark:text-uk-lost-dark">{error}</span>
                    <button type="button" className={claseAccion} onClick={() => void cargar()}>
                        Reintentar
                    </button>
                </div>
            ) : !datos ? (
                <div aria-busy="true" className="flex flex-col gap-4">
                    {[0, 1].map((i) => (
                        <div key={i} className="flex flex-col gap-2 pl-7">
                            <span className="h-4 w-48 animate-pulse rounded bg-uk-col dark:bg-white/5" />
                            <span className="h-3 w-32 animate-pulse rounded bg-uk-col dark:bg-white/5" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {visibles.length === 0 ? (
                        <p className="text-sm text-uk-muted dark:text-uk-muted-dark">Todavía no hay actividades. Registrá visitas, llamadas o tasaciones a medida que pasan.</p>
                    ) : (
                        <ol>
                            {visibles.map((a, i) => (
                                <ItemActividad
                                    key={a.id}
                                    actividad={a}
                                    mostrarOportunidad={mostrarOportunidad}
                                    ultimo={i === visibles.length - 1}
                                    ocupado={ocupado}
                                    onDarDeBaja={() => void darDeBaja(a)}
                                />
                            ))}
                        </ol>
                    )}
                    <VerMas restantes={todas.length - visibles.length} onClick={() => setLimite((l) => l + POR_PAGINA)} />
                    {datos.verBajas && bajas.length > 0 ? (
                        <button type="button" className={`${claseAccion} self-start`} onClick={() => setVerBajas((v) => !v)}>
                            {verBajas ? 'Ocultar las dadas de baja' : `Ver las dadas de baja (${bajas.length})`}
                        </button>
                    ) : null}
                </>
            )}
        </Tarjeta>
    );
};

export default PanelActividades;
