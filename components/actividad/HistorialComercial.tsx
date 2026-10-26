'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Tarjeta } from '@/components/ui/FichaPartes';
import { ItemActividad, POR_PAGINA, VerMas, claseAccion } from './PanelActividades';
import { useActividades } from './useActividades';

export interface MovimientoEtapa {
    id: string;
    fecha: string;
    titulo: ReactNode;
    meta: string;
    nota: string | null;
    sinNota: boolean;
    cierre?: { resultado: 'GANADA' | 'PERDIDA'; texto: string };
}

type Filtro = 'todo' | 'actividades' | 'etapas';

const FILTROS: { valor: Filtro; label: string }[] = [
    { valor: 'todo', label: 'Todo' },
    { valor: 'actividades', label: 'Actividades' },
    { valor: 'etapas', label: 'Etapas' },
];

const VACIOS: Record<Filtro, string> = {
    todo: 'Todavía no hay movimientos.',
    actividades: 'Todavía no hay actividades. Registrá visitas, llamadas o tasaciones a medida que pasan.',
    etapas: 'Sin cambios de etapa registrados.',
};

const ItemEtapa = ({ movimiento, ultimo }: { movimiento: MovimientoEtapa; ultimo: boolean }) => (
    <li className="relative pb-6 pl-7 last:pb-0">
        {!ultimo ? <span aria-hidden="true" className="absolute bottom-0 left-[6px] top-5 w-0.5 bg-primary/25 dark:bg-white/15" /> : null}
        <span aria-hidden="true" className="absolute left-0 top-[3px] h-[14px] w-[14px] rounded-full border-2 border-primary bg-white dark:border-gold dark:bg-uk-card-dark" />
        <p className="text-sm font-bold text-uk-muted dark:text-uk-muted-dark [&_strong]:font-extrabold [&_strong]:text-uk-ink dark:[&_strong]:text-uk-ink-dark">{movimiento.titulo}</p>
        <p className="mt-1 text-xs text-uk-muted dark:text-uk-muted-dark">
            <span className="tabular-nums">{movimiento.meta}</span>
            {movimiento.sinNota ? (
                <>
                    {' · '}
                    <em>sin nota</em>
                </>
            ) : null}
        </p>
        {movimiento.cierre ? (
            <p
                className={`mt-2 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-extrabold ${
                    movimiento.cierre.resultado === 'GANADA' ? 'bg-[#E6F6EE] text-uk-won dark:bg-success/10 dark:text-uk-won-dark' : 'bg-[#FDECEE] text-uk-lost dark:bg-danger/10 dark:text-uk-lost-dark'
                }`}
            >
                {movimiento.cierre.texto}
            </p>
        ) : null}
        {movimiento.nota ? <p className="mt-2 whitespace-pre-line rounded-lg bg-uk-page px-3 py-2.5 text-sm leading-[1.5] text-uk-ink dark:bg-uk-page-dark dark:text-uk-ink-dark">{movimiento.nota}</p> : null}
    </li>
);

const HistorialComercial = ({ oportunidadId, subtitulo, movimientos }: { oportunidadId: string; subtitulo: string; movimientos: MovimientoEtapa[] }) => {
    const { datos, error, ocupado, cargar, registrar, darDeBaja } = useActividades({ tipo: 'oportunidad', id: oportunidadId }, subtitulo);
    const [filtro, setFiltro] = useState<Filtro>('todo');
    const [verBajas, setVerBajas] = useState(false);
    const [limite, setLimite] = useState(POR_PAGINA);

    const elegirFiltro = (f: Filtro) => {
        setFiltro(f);
        setLimite(POR_PAGINA);
    };

    const actividades = datos?.actividades ?? [];
    const bajas = actividades.filter((a) => !a.activo);
    const actividadesVisibles = verBajas ? actividades : actividades.filter((a) => a.activo);

    const eventos = [
        ...(filtro !== 'etapas' ? actividadesVisibles.map((a) => ({ tipo: 'actividad' as const, fecha: a.fecha, actividad: a })) : []),
        ...(filtro !== 'actividades' ? movimientos.map((m) => ({ tipo: 'etapa' as const, fecha: m.fecha, movimiento: m })) : []),
    ].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
    const eventosVisibles = eventos.slice(0, limite);

    const total = movimientos.length + actividades.filter((a) => a.activo).length;

    return (
        <Tarjeta
            titulo="Historial comercial"
            derecha={
                <div className="flex items-center gap-4">
                    {datos ? <span className="text-[13px] tabular-nums text-uk-muted dark:text-uk-muted-dark">{total === 1 ? '1 movimiento' : `${total} movimientos`}</span> : null}
                    <button type="button" className={claseAccion} disabled={!datos || ocupado} onClick={() => void registrar()}>
                        + Registrar actividad
                    </button>
                </div>
            }
        >
            <div role="group" aria-label="Filtrar el historial" className="flex w-fit gap-1 rounded-[10px] bg-uk-col p-1 dark:bg-white/5">
                {FILTROS.map((f) => (
                    <button
                        key={f.valor}
                        type="button"
                        aria-pressed={filtro === f.valor}
                        onClick={() => elegirFiltro(f.valor)}
                        className={`h-8 rounded-lg px-3 text-[13px] font-bold ${
                            filtro === f.valor
                                ? 'bg-white text-primary shadow-[0_1px_2px_rgba(30,15,40,.06)] dark:bg-uk-card-raised-dark dark:text-uk-link-dark'
                                : 'text-uk-muted hover:text-uk-ink dark:text-uk-muted-dark dark:hover:text-uk-ink-dark'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {error ? (
                <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-bold text-uk-lost dark:text-uk-lost-dark">{error}. Se muestran solo los cambios de etapa.</span>
                    <button type="button" className={claseAccion} onClick={() => void cargar()}>
                        Reintentar
                    </button>
                </div>
            ) : null}

            {!datos && !error ? (
                <div aria-busy="true" className="flex flex-col gap-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex flex-col gap-2 pl-7">
                            <span className="h-4 w-56 animate-pulse rounded bg-uk-col dark:bg-white/5" />
                            <span className="h-3 w-36 animate-pulse rounded bg-uk-col dark:bg-white/5" />
                        </div>
                    ))}
                </div>
            ) : eventos.length === 0 ? (
                <p className="text-sm text-uk-muted dark:text-uk-muted-dark">{VACIOS[filtro]}</p>
            ) : (
                <ol>
                    {eventosVisibles.map((e, i) =>
                        e.tipo === 'actividad' ? (
                            <ItemActividad
                                key={`a-${e.actividad.id}`}
                                actividad={e.actividad}
                                mostrarOportunidad={false}
                                ultimo={i === eventosVisibles.length - 1}
                                ocupado={ocupado}
                                onDarDeBaja={() => void darDeBaja(e.actividad)}
                            />
                        ) : (
                            <ItemEtapa key={`e-${e.movimiento.id}`} movimiento={e.movimiento} ultimo={i === eventosVisibles.length - 1} />
                        ),
                    )}
                </ol>
            )}

            {datos || error ? <VerMas restantes={eventos.length - eventosVisibles.length} onClick={() => setLimite((l) => l + POR_PAGINA)} /> : null}

            {datos?.verBajas && bajas.length > 0 && filtro !== 'etapas' ? (
                <button type="button" className={`${claseAccion} self-start`} onClick={() => setVerBajas((v) => !v)}>
                    {verBajas ? 'Ocultar las actividades dadas de baja' : `Ver las actividades dadas de baja (${bajas.length})`}
                </button>
            ) : null}
        </Tarjeta>
    );
};

export default HistorialComercial;
