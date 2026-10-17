'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { cambiarEtapa } from '@/lib/oportunidad/actions';
import { toastMovimiento, toastErrorMovimiento } from '@/lib/ui/toast';
import { modalCerrarGanada, modalCerrarPerdida, modalMoverEtapa } from '@/lib/ui/modales';
import { formatearMonto } from '@/lib/enums/moneda';
import type { ColumnaEtapa, OportunidadCard } from '@/lib/oportunidad/types';
import type { Funnel, MotivoPerdida } from '@/lib/dominio';
import { inicialesDe } from '@/components/ui/Iniciales';
import PageHeader from '@/components/ui/PageHeader';
import FunnelTabs from '@/components/ui/FunnelTabs';
import IconUser from '@/components/Icon/IconUser';
import IconHome from '@/components/Icon/IconHome';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';
import IconTrendingUp from '@/components/Icon/IconTrendingUp';
import IconSearch from '@/components/Icon/IconSearch';
import EstadoPantalla from '@/components/ui/EstadoPantalla';
import SwitchVista from '@/components/ui/SwitchVista';

const ReactSortable = dynamic(() => import('react-sortablejs').then((mod) => mod.ReactSortable), { ssr: false });

interface Props {
    columnas: ColumnaEtapa[];
    funnels: Funnel[];
    activeFunnelId: string;
    conteoFunnels: Record<string, number>;
    hayError: boolean;
    usuarioId: string;
    puedeFiltrarResponsable: boolean;
    motivosPerdida: MotivoPerdida[];
}

const DIAS_AVISO_VENCIMIENTO = 3;
const ZONA_AUTOSCROLL = 100;
const MARGEN_PANEL = 40;

const etiquetaTarjeta = (task: OportunidadCard) => {
    if (task.fechaCierreEstimada) {
        const [anio, mes, dia] = task.fechaCierreEstimada.split('-').map(Number);
        const hoy = new Date();
        const dias = Math.round((Date.UTC(anio, mes - 1, dia) - Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86_400_000);
        if (dias <= DIAS_AVISO_VENCIMIENTO) {
            return { texto: `Vence ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`, clase: 'bg-uk-warn-bg text-uk-warn dark:bg-warning/10 dark:text-uk-warn-dark' };
        }
    }
    return { texto: `${task.diasEnEtapa} d en etapa`, clase: 'bg-uk-col text-uk-muted dark:bg-white/5 dark:text-uk-muted-dark' };
};

const sumaPorMoneda = (tasks: OportunidadCard[]) => {
    const totales = new Map<string, number>();
    for (const task of tasks) {
        if (task.valorEstimado != null) totales.set(task.moneda, (totales.get(task.moneda) ?? 0) + task.valorEstimado);
    }
    return [...totales].map(([moneda, total]) => formatearMonto(total, moneda as OportunidadCard['moneda'])).join(' · ');
};

const OportunidadBoard = ({ columnas, funnels, activeFunnelId, conteoFunnels, hayError, usuarioId, puedeFiltrarResponsable, motivosPerdida }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Tablero de oportunidades'));
    });

    const [columns, setColumns] = useState<ColumnaEtapa[]>(columnas);
    useEffect(() => {
        setColumns(columnas);
    }, [columnas]);

    const [busqueda, setBusqueda] = useState('');
    const [soloMias, setSoloMias] = useState(false);
    const [arrastrando, setArrastrando] = useState(false);

    const coincide = (task: OportunidadCard) => {
        const texto = busqueda.trim().toLowerCase();
        if (soloMias && task.responsableId !== usuarioId) return false;
        return !texto || task.titulo.toLowerCase().includes(texto) || task.contacto.toLowerCase().includes(texto);
    };
    const hayFiltro = busqueda.trim() !== '' || soloMias;

    const regionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!arrastrando) return;
        let x: number | null = null;
        let frame = 0;
        const registrar = (event: MouseEvent | PointerEvent | DragEvent) => {
            x = event.clientX;
        };
        const tick = () => {
            const region = regionRef.current;
            if (region && x !== null) {
                const { left, right } = region.getBoundingClientRect();
                if (x >= right - ZONA_AUTOSCROLL && x <= right + MARGEN_PANEL) {
                    region.scrollBy({ left: 3 + 13 * Math.min(1, (x - (right - ZONA_AUTOSCROLL)) / ZONA_AUTOSCROLL), behavior: 'instant' });
                } else if (x <= left + ZONA_AUTOSCROLL && x >= left - MARGEN_PANEL) {
                    region.scrollBy({ left: -(3 + 13 * Math.min(1, (left + ZONA_AUTOSCROLL - x) / ZONA_AUTOSCROLL)), behavior: 'instant' });
                }
            }
            frame = requestAnimationFrame(tick);
        };
        const terminar = () => setArrastrando(false);
        document.addEventListener('dragend', terminar);
        document.addEventListener('drop', terminar);
        document.addEventListener('dragover', registrar);
        document.addEventListener('drag', registrar);
        document.addEventListener('pointermove', registrar);
        frame = requestAnimationFrame(tick);
        return () => {
            document.removeEventListener('dragend', terminar);
            document.removeEventListener('drop', terminar);
            document.removeEventListener('dragover', registrar);
            document.removeEventListener('drag', registrar);
            document.removeEventListener('pointermove', registrar);
            cancelAnimationFrame(frame);
        };
    }, [arrastrando]);

    const origenRef = useRef<{ cardId: string; etapaId: string; snapshot: ColumnaEtapa[] } | null>(null);
    const ocupadoRef = useRef(false);

    const cambiarFunnel = (funnelId: string) => {
        router.push(`/oportunidades/tablero?funnel=${funnelId}`);
    };

    const restaurar = () => {
        if (origenRef.current) setColumns(origenRef.current.snapshot);
    };

    const moverEntreAbiertas = async (cardId: string, destEtapaId: string, etapaOrigenId: string): Promise<void> => {
        const nombreEtapa = (id: string) => columns.find((c) => c.id === id)?.title ?? '';
        const tarjeta = columns.flatMap((c) => c.tasks).find((t) => t.id === cardId);
        const titulo = tarjeta?.titulo ?? origenRef.current?.snapshot.flatMap((c) => c.tasks).find((t) => t.id === cardId)?.titulo ?? '';

        const confirmacion = await modalMoverEtapa({ titulo, etapaOrigen: nombreEtapa(etapaOrigenId), etapaDestino: nombreEtapa(destEtapaId) });
        if (!confirmacion) {
            restaurar();
            return;
        }

        const res = await cambiarEtapa({ oportunidadId: cardId, etapaId: destEtapaId, observacion: confirmacion.observacion });
        if (!res.ok) {
            restaurar();
            void toastErrorMovimiento(nombreEtapa(etapaOrigenId)).then(async (reintentar) => {
                if (!reintentar) return;
                const nuevo = await cambiarEtapa({ oportunidadId: cardId, etapaId: destEtapaId, observacion: confirmacion.observacion });
                if (!nuevo.ok) void toastErrorMovimiento(nombreEtapa(etapaOrigenId));
                router.refresh();
            });
            return;
        }
        router.refresh();
        void toastMovimiento(titulo, nombreEtapa(destEtapaId)).then(async (deshacer) => {
            if (!deshacer) return;
            const revertido = await cambiarEtapa({ oportunidadId: cardId, etapaId: etapaOrigenId, observacion: 'Movimiento deshecho' });
            if (!revertido.ok) void toastErrorMovimiento(nombreEtapa(destEtapaId));
            router.refresh();
        });
    };

    const cerrarTarjeta = async (cardId: string, destEtapaId: string, etapaOrigenId: string) => {
        const destino = columns.find((c) => c.id === destEtapaId);
        const tarjeta = origenRef.current?.snapshot.flatMap((c) => c.tasks).find((t) => t.id === cardId);
        const etapaOrigen = origenRef.current?.snapshot.find((c) => c.id === etapaOrigenId)?.title ?? '';
        if (!destino || !tarjeta) return restaurar();

        const datos = { titulo: tarjeta.titulo, contacto: tarjeta.contacto, etapaOrigen };
        let payload: Record<string, unknown> = { oportunidadId: cardId, etapaId: destEtapaId };

        if (destino.resultado === 'GANADA') {
            const cierre = await modalCerrarGanada({ ...datos, valorEstimado: tarjeta.valorEstimado, moneda: tarjeta.moneda });
            if (!cierre) return restaurar();
            payload = { ...payload, valorFinal: cierre.valorFinal, fechaCierre: cierre.fechaCierre, observacion: cierre.observacion };
        } else {
            const cierre = await modalCerrarPerdida({ ...datos, motivos: motivosPerdida });
            if (!cierre) return restaurar();
            payload = { ...payload, motivoPerdidaId: cierre.motivoPerdidaId, fechaCierre: cierre.fechaCierre, observacion: cierre.observacion };
        }

        const res = await cambiarEtapa(payload);
        if (!res.ok) {
            restaurar();
            await toastErrorMovimiento(etapaOrigen);
            return;
        }
        router.refresh();
    };

    const procesarDestino = async (cardId: string, destEtapaId: string) => {
        const origen = origenRef.current;
        if (!origen || ocupadoRef.current || origen.etapaId === destEtapaId) return;
        ocupadoRef.current = true;
        try {
            const destino = columns.find((c) => c.id === destEtapaId);
            if (destino?.resultado === 'ABIERTA') await moverEntreAbiertas(cardId, destEtapaId, origen.etapaId);
            else await cerrarTarjeta(cardId, destEtapaId, origen.etapaId);
        } finally {
            ocupadoRef.current = false;
        }
    };

    const alIniciarArrastre = (evt: { item: HTMLElement; from: HTMLElement }) => {
        setArrastrando(true);
        origenRef.current = {
            cardId: evt.item.dataset.id ?? '',
            etapaId: evt.from.closest('[data-group]')?.getAttribute('data-group') ?? '',
            snapshot: columns,
        };
    };

    const abiertas = columns.filter((column) => column.resultado === 'ABIERTA');
    const ganada = columns.find((column) => column.resultado === 'GANADA');
    const perdida = columns.find((column) => column.resultado === 'PERDIDA');

    const columna = (column: ColumnaEtapa) => {
        const suma = sumaPorMoneda(column.tasks);
        const visibles = hayFiltro ? column.tasks.filter(coincide) : column.tasks;
        return (
            <div
                key={column.id}
                className={`w-[248px] max-md:w-[85vw] max-md:snap-start shrink-0 rounded-xl bg-uk-col p-3 dark:border dark:border-[#1E2740] dark:bg-uk-col-dark ${column.activo ? '' : 'opacity-60'}`}
                data-group={column.id}
            >
                <div className="mb-3 px-1">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="flex min-w-0 items-center gap-2 text-sm font-extrabold text-uk-ink dark:text-uk-ink-dark">
                            <span className="truncate">{column.title}</span>
                            {!column.activo && <span className="text-xs font-bold text-uk-muted dark:text-uk-muted-dark">Desactivada</span>}
                        </h2>
                        <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-extrabold tabular-nums text-uk-ink dark:bg-white/10 dark:text-uk-ink-dark">{column.tasks.length}</span>
                    </div>
                    <p className="mt-1 text-xs tabular-nums text-uk-muted dark:text-uk-muted-dark">{suma || 'Sin valor estimado'}</p>
                </div>
                <div className="relative">
                    {visibles.length === 0 && (
                        <div className="pointer-events-none absolute inset-0 grid h-[120px] place-content-center rounded-[10px] border-[1.5px] border-dashed border-[#CFC4D6] text-xs text-uk-muted dark:border-uk-line-dark dark:text-uk-muted-dark">
                            Soltá una tarjeta acá
                        </div>
                    )}
                    <ReactSortable
                        list={visibles}
                        disabled={hayFiltro}
                        setList={(newState: any, sortable: any) => {
                            if (!sortable || hayFiltro) return;
                            const destId = sortable.el.closest('[data-group]')?.getAttribute('data-group') || column.id;
                            const before = columns.find((c) => c.id === destId);
                            const beforeIds = new Set(before ? before.tasks.map((t) => t.id) : []);
                            const entrante = newState.find((t: any) => !beforeIds.has(t.id));
                            setColumns((cols) => cols.map((c) => (c.id === destId ? { ...c, tasks: newState } : c)));
                            if (entrante) {
                                procesarDestino(entrante.id, destId);
                            }
                        }}
                        onStart={alIniciarArrastre}
                        onEnd={() => setArrastrando(false)}
                        animation={200}
                        group={{ name: 'oportunidades', pull: true, put: column.activo }}
                        ghostClass="sortable-ghost"
                        dragClass="sortable-drag"
                        className="connect-sorting-content min-h-[120px] space-y-2"
                    >
                        {visibles.map((task) => {
                            const etiqueta = etiquetaTarjeta(task);
                            return (
                                <div className="sortable-list" key={task.id} data-id={task.id}>
                                    <div className="flex cursor-grab select-none flex-col gap-2 rounded-[10px] border border-uk-line bg-white p-3 shadow-[0_1px_2px_rgba(30,15,40,.06)] dark:border-uk-line-dark dark:bg-uk-card-raised-dark">
                                        <div className="flex items-start justify-between gap-2">
                                            <Link href={`/oportunidades/${task.id}`} className="text-sm font-extrabold text-uk-ink hover:underline dark:text-uk-ink-dark">
                                                {task.titulo}
                                            </Link>
                                            <span className={`shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${etiqueta.clase}`}>{etiqueta.texto}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-uk-muted dark:text-uk-muted-dark">
                                            <IconUser className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{task.contacto}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-uk-muted dark:text-uk-muted-dark">
                                            <IconHome className="h-3.5 w-3.5 shrink-0" duotone={false} />
                                            {task.inmueble ? <span className="truncate">{task.inmueble}</span> : <span className="italic">Sin inmueble asociado</span>}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 border-t border-uk-col pt-2 dark:border-uk-line-dark">
                                            <span className="text-sm font-extrabold tabular-nums text-uk-money dark:text-uk-money-dark">
                                                {task.valorEstimado != null ? formatearMonto(task.valorEstimado, task.moneda) : <span className="font-normal text-uk-muted dark:text-uk-muted-dark">— Sin valor</span>}
                                            </span>
                                            <span className="grid h-[26px] w-[26px] shrink-0 place-content-center rounded-full bg-primary-light text-[10px] font-extrabold text-primary dark:bg-white/10 dark:text-uk-link-dark" title={task.responsable}>
                                                {inicialesDe(task.responsable)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </ReactSortable>
                </div>
            </div>
        );
    };

    const zonaCierre = (etapa: ColumnaEtapa | undefined, tipo: 'ganada' | 'perdida') => {
        const esGanada = tipo === 'ganada';
        const cantidad = etapa?.tasks.length ?? 0;
        const verHref = `/oportunidades?funnelId=${activeFunnelId}&estado=${esGanada ? 'GANADA' : 'PERDIDA'}`;
        return (
            <div
                data-group={etapa?.id}
                className={`uk-zona-cierre relative flex min-h-[140px] flex-1 flex-col max-md:min-h-[88px] justify-between rounded-xl border-[1.5px] border-dashed p-3 ${
                    esGanada
                        ? 'border-[#6CC79A] bg-[#EEF9F3] dark:border-uk-won-dark/40 dark:bg-success/5'
                        : 'border-[#EC8D93] bg-[#FDF1F2] dark:border-uk-lost-dark/40 dark:bg-danger/5'
                }`}
            >
                {etapa && (
                    <ReactSortable
                        list={[]}
                        setList={(newState: any, sortable: any) => {
                            if (!sortable || !newState.length) return;
                            procesarDestino(newState[0].id, etapa.id);
                        }}
                        animation={0}
                        group={{ name: 'oportunidades', pull: false, put: true }}
                        className="absolute inset-0 z-10"
                    >
                        {[]}
                    </ReactSortable>
                )}
                <div>
                    <p className={`text-sm font-extrabold ${esGanada ? 'text-uk-won dark:text-uk-won-dark' : 'text-uk-lost dark:text-uk-lost-dark'}`}>{etapa?.title ?? (esGanada ? 'Ganada' : 'Perdida')}</p>
                    <p className="mt-1 text-xs text-uk-muted dark:text-uk-muted-dark">{esGanada ? 'Soltá acá para cerrar como ganada.' : 'Soltá acá y elegí el motivo.'}</p>
                </div>
                <p className="relative z-20 text-xs font-bold tabular-nums text-uk-muted dark:text-uk-muted-dark">
                    {cantidad} {esGanada ? (cantidad === 1 ? 'cerrada' : 'cerradas') : cantidad === 1 ? 'perdida' : 'perdidas'} ·{' '}
                    <Link href={verHref} className="text-primary hover:underline dark:text-uk-link-dark">
                        Ver
                    </Link>
                </p>
            </div>
        );
    };

    const funnelActivo = funnels.find((f) => f.id === activeFunnelId);

    const totalTarjetas = columns.reduce((total, c) => total + c.tasks.length, 0);
    const totalVisibles = columns.reduce((total, c) => total + c.tasks.filter(coincide).length, 0);
    const filtrosActivos = [busqueda.trim() ? `búsqueda “${busqueda.trim()}”` : null, soloMias ? 'responsable: solo mías' : null].filter((f): f is string => f !== null);
    const limpiarFiltros = () => {
        setBusqueda('');
        setSoloMias(false);
    };

    return (
        <div className="flex h-[calc(100dvh-10rem)] flex-col">
            <PageHeader
                title="Tablero de oportunidades"
                description={<>Arrastrá una tarjeta para cambiar de etapa. Soltala en <strong>Ganada</strong> o <strong>Perdida</strong> para cerrarla.</>}
                actions={
                    <>
                        <SwitchVista vista="tablero" />
                        <Link href="/oportunidades/nuevo" className="btn btn-primary h-10 rounded-[10px]">
                            Nueva oportunidad
                        </Link>
                    </>
                }
            />
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                    <FunnelTabs tabs={funnels} activeId={activeFunnelId} conteos={conteoFunnels} onSelect={cambiarFunnel} ariaLabel="Funnels" />
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 pb-1.5 sm:w-auto">
                    <input
                        type="search"
                        className="form-input h-[38px] w-full rounded-[9px] sm:w-56"
                        placeholder="Buscar título o contacto"
                        aria-label="Buscar título o contacto"
                        value={busqueda}
                        onChange={(event) => setBusqueda(event.target.value)}
                    />
                    {puedeFiltrarResponsable ? (
                        <select className="form-select h-[38px] w-full rounded-[9px] sm:w-44" aria-label="Responsable" value={soloMias ? 'mias' : 'todos'} onChange={(event) => setSoloMias(event.target.value === 'mias')}>
                            <option value="todos">Responsable: Todos</option>
                            <option value="mias">Responsable: Solo mías</option>
                        </select>
                    ) : null}
                </div>
            </div>

            {hayError ? (
                <EstadoPantalla
                    variante="error"
                    icono={<IconInfoTriangle className="h-7 w-7" />}
                    titulo="No pudimos cargar las oportunidades"
                    descripcion="Puede ser un problema de conexión. Tus datos no se perdieron."
                    acciones={
                        <button type="button" className="btn btn-primary h-10 rounded-[10px]" onClick={() => router.refresh()}>
                            Reintentar
                        </button>
                    }
                />
            ) : totalTarjetas === 0 ? (
                <EstadoPantalla
                    variante="vacio"
                    icono={<IconTrendingUp className="h-7 w-7" duotone={false} />}
                    titulo="Todavía no hay oportunidades en este funnel"
                    descripcion="Cuando cargues la primera, la vas a ver acá y la podés arrastrar entre etapas."
                    acciones={
                        <Link href="/oportunidades/nuevo" className="btn btn-primary h-10 rounded-[10px]">
                            Nueva oportunidad
                        </Link>
                    }
                />
            ) : hayFiltro && totalVisibles === 0 ? (
                <EstadoPantalla
                    variante="vacio"
                    icono={<IconSearch className="h-7 w-7" />}
                    titulo="Ninguna oportunidad coincide"
                    descripcion={`Tenés ${filtrosActivos.length} ${filtrosActivos.length === 1 ? 'filtro activo' : 'filtros activos'}: ${filtrosActivos.join(', ')}.`}
                    acciones={
                        <button type="button" className="btn btn-cancel h-10 rounded-[10px]" onClick={limpiarFiltros}>
                            Limpiar filtros
                        </button>
                    }
                />
            ) : (
                <div className="flex min-h-0 flex-1 gap-3">
                    <div
                        ref={regionRef}
                        role="region"
                        aria-label={`Etapas del funnel ${funnelActivo?.nombre ?? ''}`}
                        tabIndex={0}
                        className="min-w-0 flex-1 snap-x snap-mandatory overflow-auto md:snap-none [scrollbar-color:#CFC4D6_transparent] dark:[scrollbar-color:#2A3350_transparent] focus-visible:ring-2 focus-visible:ring-primary/40 dark:focus-visible:ring-gold/50"
                    >
                        <div className="flex flex-nowrap items-start gap-3 pb-2">{abiertas.map(columna)}</div>
                    </div>
                    <aside
                        aria-label="Cerrar oportunidad"
                        className={`flex w-[216px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-uk-line pb-2 pl-3 [scrollbar-color:#CFC4D6_transparent] dark:border-uk-line-dark dark:[scrollbar-color:#2A3350_transparent] max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:w-auto max-md:flex-row max-md:border-l-0 max-md:border-t max-md:bg-uk-page max-md:p-3 max-md:dark:bg-uk-page-dark ${arrastrando ? '' : 'max-md:hidden'}`}
                    >
                        <p className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-uk-muted dark:text-uk-muted-dark max-md:hidden">Cerrar</p>
                        {zonaCierre(ganada, 'ganada')}
                        {zonaCierre(perdida, 'perdida')}
                    </aside>
                </div>
            )}
        </div>
    );
};

export default OportunidadBoard;
