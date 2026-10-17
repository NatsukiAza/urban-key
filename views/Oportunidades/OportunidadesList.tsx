'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect, useRef, useMemo } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import IconPlus from '@/components/Icon/IconPlus';
import IconX from '@/components/Icon/IconX';
import IconSearch from '@/components/Icon/IconSearch';
import IconHorizontalDots from '@/components/Icon/IconHorizontalDots';
import IconTrendingUp from '@/components/Icon/IconTrendingUp';
import { cambiarEtapa, darDeBajaOportunidad, reasignarResponsable } from '@/lib/oportunidad/actions';
import { showToast, toastMovimiento, toastErrorMovimiento } from '@/lib/ui/toast';
import { modalDarDeBaja, modalMoverEtapa } from '@/lib/ui/modales';
import { estadoOportunidadConfig, estadoOportunidadOptions } from '@/lib/enums/estadoOportunidad';
import { formatearMonto } from '@/lib/enums/moneda';
import { venceProximamente } from '@/lib/formato';
import type { OportunidadRow, FiltroOportunidades } from '@/lib/oportunidad/types';
import type { Usuario, Funnel, Origen, Etapa, MotivoPerdida } from '@/lib/dominio';
import OportunidadesTableSkeleton from '@/views/Oportunidades/OportunidadesTableSkeleton';
import PageHeader from '@/components/ui/PageHeader';
import EstadoChip from '@/components/ui/EstadoChip';
import EstadoPantalla from '@/components/ui/EstadoPantalla';
import SwitchVista from '@/components/ui/SwitchVista';
import Dropdown from '@/components/Dropdown';
import Select from '@/components/ui/Select';
import { inicialesDe } from '@/components/ui/Iniciales';
import { pedirDatosCierre } from './pedirDatosCierre';
import { pedirReasignacion } from './pedirReasignacion';

const DataTable = dynamic(() => import('mantine-datatable').then((mod) => mod.DataTable), {
    ssr: false,
    loading: () => <OportunidadesTableSkeleton soloFilas />,
}) as any;

interface Props {
    rows: OportunidadRow[];
    filtro: FiltroOportunidades;
    usuarios: Usuario[];
    funnels: Funnel[];
    origenes: Origen[];
    etapas: Etapa[];
    motivosPerdida: MotivoPerdida[];
    puedeReasignar: boolean;
}

const claseItemMenu = 'flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13px] font-bold text-uk-ink hover:bg-primary-light dark:text-uk-ink-dark dark:hover:bg-uk-line-dark';

const etapaSiguiente = (row: OportunidadRow, etapas: Etapa[]) => {
    const delFunnel = etapas.filter((etapa) => etapa.funnelId === row.funnelId).sort((a, b) => a.orden - b.orden);
    const actual = delFunnel.find((etapa) => etapa.id === row.etapaId);
    if (!actual) return null;
    return delFunnel.find((etapa) => etapa.orden > actual.orden) ?? null;
};

const plural = (n: number, singular: string, pluralTexto: string) => `${n} ${n === 1 ? singular : pluralTexto}`;

const OportunidadesList = ({ rows, filtro, usuarios, funnels, origenes, etapas, motivosPerdida, puedeReasignar }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Oportunidades'));
    });

    const [avanzandoId, setAvanzandoId] = useState<string | null>(null);
    const [panelAbierto, setPanelAbierto] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!panelAbierto) return;
        const cerrar = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) setPanelAbierto(false);
        };
        const esc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setPanelAbierto(false);
        };
        document.addEventListener('mousedown', cerrar);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('mousedown', cerrar);
            document.removeEventListener('keydown', esc);
        };
    }, [panelAbierto]);

    const aplicarFiltro = (campo: keyof FiltroOportunidades, valor: string) => {
        const next = new URLSearchParams();
        const merged: Record<string, string | undefined> = { ...filtro, [campo]: valor || undefined };
        if (campo === 'funnelId' && merged.etapaId) {
            const etapa = etapas.find((item) => item.id === merged.etapaId);
            if (!valor || (etapa && etapa.funnelId !== valor)) merged.etapaId = undefined;
        }
        Object.entries(merged).forEach(([k, v]) => {
            if (v) next.set(k, String(v));
        });
        router.push(`/oportunidades${next.toString() ? `?${next.toString()}` : ''}`);
    };

    const [search, setSearch] = useState('');

    const limpiarFiltros = () => {
        setSearch('');
        router.push('/oportunidades');
    };

    const etapasDelFunnel = filtro.funnelId ? etapas.filter((etapa) => etapa.funnelId === filtro.funnelId).sort((a, b) => a.orden - b.orden) : [];

    const nombreDe = {
        funnelId: funnels.find((f) => f.id === filtro.funnelId)?.nombre,
        estado: filtro.estado ? estadoOportunidadConfig[filtro.estado].label : undefined,
        responsableId: (() => {
            const u = usuarios.find((x) => x.id === filtro.responsableId);
            return u ? `${u.nombre} ${u.apellido}` : undefined;
        })(),
        etapaId: etapas.find((e) => e.id === filtro.etapaId)?.nombre,
        origenId: origenes.find((o) => o.id === filtro.origenId)?.nombre,
    };
    type Chip = { campo: keyof FiltroOportunidades; etiqueta: string; texto: string };
    const candidatos: { campo: keyof FiltroOportunidades; etiqueta: string; texto: string | undefined }[] = [
        { campo: 'funnelId', etiqueta: 'Funnel', texto: nombreDe.funnelId },
        { campo: 'estado', etiqueta: 'Estado', texto: nombreDe.estado },
        { campo: 'responsableId', etiqueta: 'Responsable', texto: nombreDe.responsableId },
        { campo: 'etapaId', etiqueta: 'Etapa', texto: nombreDe.etapaId },
        { campo: 'origenId', etiqueta: 'Origen', texto: nombreDe.origenId },
    ];
    const chips: Chip[] = candidatos.flatMap((c) => (filtro[c.campo] && c.texto ? [{ campo: c.campo, etiqueta: c.etiqueta, texto: c.texto }] : []));
    const nExtras = [filtro.responsableId, filtro.etapaId, filtro.origenId].filter(Boolean).length;
    const nTotal = nExtras + [filtro.funnelId, filtro.estado].filter(Boolean).length;
    const hayFiltro = chips.length > 0 || search.trim() !== '';

    const notificarError = (mensaje: string | undefined) => showToast(mensaje ?? 'No se pudo completar la acción', 'error');

    const avanzar = async (row: OportunidadRow) => {
        const destino = etapaSiguiente(row, etapas);
        if (!destino || avanzandoId) return;

        if (destino.resultado === 'ABIERTA') {
            const confirmacion = await modalMoverEtapa({ titulo: row.titulo, etapaOrigen: row.etapa, etapaDestino: destino.nombre });
            if (!confirmacion) return;
            setAvanzandoId(row.id);
            const res = await cambiarEtapa({ oportunidadId: row.id, etapaId: destino.id, observacion: confirmacion.observacion ?? 'Avance desde el listado' });
            setAvanzandoId(null);
            if (!res.ok) {
                void toastErrorMovimiento(row.etapa);
                return;
            }
            router.refresh();
            void toastMovimiento(row.titulo, destino.nombre).then(async (deshacer) => {
                if (!deshacer) return;
                const revertido = await cambiarEtapa({ oportunidadId: row.id, etapaId: row.etapaId, observacion: 'Movimiento deshecho' });
                if (!revertido.ok) void toastErrorMovimiento(destino.nombre);
                router.refresh();
            });
            return;
        }

        const cierre = await pedirDatosCierre({
            resultado: destino.resultado,
            etapaNombre: destino.nombre,
            motivosPerdida,
            valorEstimado: row.valorEstimado,
            moneda: row.moneda,
            titulo: row.titulo,
            contacto: row.contacto,
        });
        if (!cierre) return;

        setAvanzandoId(row.id);
        const res = await cambiarEtapa({
            oportunidadId: row.id,
            etapaId: destino.id,
            ...cierre,
            observacion: cierre.observacion ?? 'Avance desde el listado',
        });
        setAvanzandoId(null);
        if (res.ok) {
            showToast(res.mensaje ?? '', 'success');
            router.refresh();
        } else {
            notificarError(res.mensaje);
        }
    };

    const reasignar = async (row: OportunidadRow) => {
        const nuevoId = await pedirReasignacion(usuarios, row.responsableId);
        if (!nuevoId) return;
        const res = await reasignarResponsable({ oportunidadId: row.id, responsableId: nuevoId });
        if (res.ok) {
            showToast(res.mensaje ?? '', 'success');
            router.refresh();
        } else {
            notificarError(res.mensaje);
        }
    };

    const darDeBaja = async (row: OportunidadRow) => {
        if (!(await modalDarDeBaja(row.titulo))) return;
        const res = await darDeBajaOportunidad(row.id);
        if (res.ok) {
            showToast(res.mensaje ?? '', 'success');
            router.refresh();
        } else {
            notificarError(res.mensaje);
        }
    };

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 25, 50];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'titulo', direction: 'asc' });

    const filtradas = useMemo(() => {
        const q = search.trim().toLowerCase();
        const base = q ? rows.filter((item) => item.titulo.toLowerCase().includes(q) || item.contacto.toLowerCase().includes(q) || (item.inmueble ?? '').toLowerCase().includes(q)) : rows;
        const ordenadas = sortBy(base, sortStatus.columnAccessor);
        return sortStatus.direction === 'desc' ? ordenadas.reverse() : ordenadas;
    }, [rows, search, sortStatus]);

    const records = useMemo(() => filtradas.slice((page - 1) * pageSize, page * pageSize), [filtradas, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, search, rows]);

    const abiertas = rows.filter((row) => row.estado === 'ABIERTA').length;

    const selectFunnel = (
        <Select
            ariaLabel="Funnel"
            className="w-full sm:w-[190px]"
            value={filtro.funnelId ?? ''}
            onChange={(v) => aplicarFiltro('funnelId', v)}
            opciones={[{ value: '', label: 'Todos los funnels' }, ...funnels.map((f) => ({ value: f.id, label: f.nombre }))]}
        />
    );
    const selectEstado = (
        <Select
            ariaLabel="Estado"
            className="w-full sm:w-[170px]"
            value={filtro.estado ?? ''}
            onChange={(v) => aplicarFiltro('estado', v)}
            opciones={[{ value: '', label: 'Todos los estados' }, ...estadoOportunidadOptions.map((o) => ({ value: o.value, label: o.label }))]}
        />
    );

    const etiquetaCampo = 'mb-1 block text-xs font-bold text-uk-muted dark:text-uk-muted-dark';

    return (
        <div>
            <PageHeader
                title="Oportunidades"
                description={`${plural(rows.length, 'oportunidad', 'oportunidades')} · ${plural(abiertas, 'abierta', 'abiertas')}`}
                actions={
                    <>
                        <SwitchVista vista="lista" />
                        <Link href="/oportunidades/nuevo" className="btn btn-primary h-[42px] gap-2 rounded-[10px]">
                            <IconPlus />
                            Nueva oportunidad
                        </Link>
                    </>
                }
            />

            <div className="panel !p-0 !rounded-[14px] shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:!border dark:!border-[#232C45] dark:!bg-uk-card-dark dark:shadow-none">
                <div className="flex flex-col gap-3 border-b border-uk-line px-5 py-4 dark:border-[#232C45]">
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="relative !mb-0 flex h-[38px] w-full items-center sm:max-w-[320px] sm:flex-1">
                            <span className="sr-only">Buscar oportunidades</span>
                            <IconSearch className="pointer-events-none absolute left-3 h-4 w-4 text-uk-muted dark:text-uk-muted-dark" />
                            <input
                                type="search"
                                className="form-input h-[38px] w-full rounded-[9px] pl-9 text-[13px] dark:!bg-uk-page-dark"
                                placeholder="Buscar título, contacto o inmueble"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </label>
                        <div className="hidden sm:flex">{selectFunnel}</div>
                        <div className="hidden sm:flex">{selectEstado}</div>
                        <div ref={panelRef} className="relative">
                            <button
                                type="button"
                                aria-expanded={panelAbierto}
                                aria-haspopup="dialog"
                                onClick={() => setPanelAbierto((v) => !v)}
                                className={`inline-flex h-[38px] items-center rounded-[9px] border px-3 text-[13px] font-bold ${
                                    nExtras > 0 || (nTotal > 0 && typeof window !== 'undefined' && window.innerWidth < 640)
                                        ? 'border-primary bg-primary-light text-primary dark:border-uk-link-dark dark:bg-uk-link-dark/10 dark:text-uk-link-dark'
                                        : 'border-uk-field bg-white text-uk-ink hover:bg-uk-col dark:border-uk-field-dark dark:bg-uk-page-dark dark:text-uk-ink-dark dark:hover:bg-white/5'
                                }`}
                            >
                                <span className="hidden sm:inline">Más filtros{nExtras > 0 ? ` (${nExtras})` : ''}</span>
                                <span className="sm:hidden">Filtros{nTotal > 0 ? ` (${nTotal})` : ''}</span>
                            </button>
                            {panelAbierto ? (
                                <div
                                    role="dialog"
                                    aria-label="Más filtros"
                                    className="absolute left-0 top-full z-30 mt-2 flex w-[min(320px,calc(100vw-3rem))] flex-col gap-3 rounded-xl border border-uk-line bg-white p-4 shadow-[0_8px_24px_rgba(30,15,40,.16)] dark:border-uk-line-dark dark:bg-uk-card-dark sm:left-auto sm:right-0"
                                >
                                    <div className="flex flex-col gap-3 sm:hidden">
                                        <div>
                                            <span className={etiquetaCampo}>Funnel</span>
                                            {selectFunnel}
                                        </div>
                                        <div>
                                            <span className={etiquetaCampo}>Estado</span>
                                            {selectEstado}
                                        </div>
                                    </div>
                                    <div>
                                        <span id="lbl-responsable" className={etiquetaCampo}>
                                            Responsable
                                        </span>
                                        <Select
                                            id="filtro-responsable"
                                            ariaLabel="Responsable"
                                            value={filtro.responsableId ?? ''}
                                            onChange={(v) => aplicarFiltro('responsableId', v)}
                                            opciones={[{ value: '', label: 'Todos los responsables' }, ...usuarios.map((u) => ({ value: u.id, label: `${u.nombre} ${u.apellido}` }))]}
                                        />
                                    </div>
                                    <div>
                                        <span className={etiquetaCampo}>Etapa</span>
                                        <Select
                                            id="filtro-etapa"
                                            ariaLabel="Etapa"
                                            disabled={!filtro.funnelId}
                                            placeholder="Elegí un funnel primero"
                                            value={filtro.etapaId ?? ''}
                                            onChange={(v) => aplicarFiltro('etapaId', v)}
                                            opciones={filtro.funnelId ? [{ value: '', label: 'Todas las etapas' }, ...etapasDelFunnel.map((e) => ({ value: e.id, label: e.nombre }))] : []}
                                        />
                                    </div>
                                    <div>
                                        <span className={etiquetaCampo}>Origen</span>
                                        <Select
                                            id="filtro-origen"
                                            ariaLabel="Origen"
                                            value={filtro.origenId ?? ''}
                                            onChange={(v) => aplicarFiltro('origenId', v)}
                                            opciones={[{ value: '', label: 'Todos los orígenes' }, ...origenes.map((o) => ({ value: o.id, label: o.nombre }))]}
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {chips.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {chips.map((chip) => (
                                <span key={chip.campo} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary-light pl-2.5 pr-1 text-xs font-bold text-primary dark:bg-uk-link-dark/[.12] dark:text-uk-link-dark">
                                    {chip.etiqueta}: {chip.texto}
                                    <button
                                        type="button"
                                        aria-label={`Quitar filtro ${chip.etiqueta}`}
                                        title={`Quitar filtro ${chip.etiqueta}`}
                                        onClick={() => aplicarFiltro(chip.campo, '')}
                                        className="grid h-[22px] w-[22px] place-content-center rounded-full hover:bg-primary/10 dark:hover:bg-white/10"
                                    >
                                        <IconX className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                            <button type="button" onClick={limpiarFiltros} className="text-xs font-extrabold text-primary underline hover:no-underline dark:text-uk-link-dark">
                                Limpiar filtros
                            </button>
                        </div>
                    ) : null}
                </div>

                {rows.length === 0 && !hayFiltro ? (
                    <div className="px-5 py-5">
                        <EstadoPantalla
                            variante="vacio"
                            icono={<IconTrendingUp className="h-7 w-7" duotone={false} />}
                            titulo="Todavía no hay oportunidades"
                            descripcion="Cargá la primera para empezar a seguirla en el tablero."
                            acciones={
                                <Link href="/oportunidades/nuevo" className="btn btn-primary h-10 rounded-[10px]">
                                    Nueva oportunidad
                                </Link>
                            }
                        />
                    </div>
                ) : filtradas.length === 0 ? (
                    <div className="px-5 py-5">
                        <EstadoPantalla
                            variante="vacio"
                            icono={<IconSearch className="h-7 w-7" />}
                            titulo="Ninguna oportunidad coincide"
                            descripcion={
                                chips.length > 0
                                    ? `Tenés ${plural(chips.length + (search.trim() ? 1 : 0), 'filtro activo', 'filtros activos')}: ${[...chips.map((c) => `${c.etiqueta.toLowerCase()} ${c.texto}`), ...(search.trim() ? [`búsqueda “${search.trim()}”`] : [])].join(', ')}.`
                                    : `No hay resultados para “${search.trim()}”.`
                            }
                            acciones={
                                <button type="button" className="btn btn-cancel h-10 rounded-[10px]" onClick={limpiarFiltros}>
                                    Limpiar filtros
                                </button>
                            }
                        />
                    </div>
                ) : (
                    <div className="datatables lista-oportunidades pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={records}
                            idAccessor="id"
                            minHeight={0}
                            rowClassName="cursor-pointer"
                            onRowClick={(row: OportunidadRow) => router.push(`/oportunidades/${row.id}`)}
                            columns={[
                                {
                                    accessor: 'titulo',
                                    title: 'Título',
                                    sortable: true,
                                    render: ({ id, titulo }: OportunidadRow) => (
                                        <Link href={`/oportunidades/${id}`} title={titulo} className="block max-w-[230px] truncate font-extrabold text-primary no-underline hover:underline dark:text-uk-link-dark" onClick={(e) => e.stopPropagation()}>
                                            {titulo}
                                        </Link>
                                    ),
                                },
                                { accessor: 'contacto', title: 'Interesado', sortable: true },
                                {
                                    accessor: 'inmueble',
                                    title: 'Inmueble',
                                    sortable: true,
                                    render: ({ inmueble }: OportunidadRow) =>
                                        inmueble ? <span title={inmueble} className="block max-w-[170px] truncate text-uk-muted dark:text-uk-muted-dark">{inmueble}</span> : <span className="italic text-uk-muted dark:text-uk-muted-dark">Sin inmueble</span>,
                                },
                                {
                                    accessor: 'responsable',
                                    title: 'Responsable',
                                    sortable: true,
                                    render: ({ responsable }: OportunidadRow) => (
                                        <span
                                            title={responsable}
                                            className="inline-grid h-[26px] w-[26px] place-content-center rounded-full bg-primary-light text-[10px] font-extrabold text-primary dark:bg-[#3A2541] dark:text-[#E9D3EE]"
                                        >
                                            {inicialesDe(responsable)}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'etapa',
                                    title: 'Etapa / Funnel',
                                    sortable: true,
                                    render: (row: OportunidadRow) => {
                                        const vence = row.estado === 'ABIERTA' ? venceProximamente(row.fechaCierreEstimada) : null;
                                        return (
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1.5 font-bold text-uk-ink dark:text-uk-ink-dark">
                                                    {row.etapa}
                                                    {vence ? (
                                                        <span className="rounded-md bg-uk-warn-bg px-1.5 py-px text-[11px] font-extrabold text-uk-warn dark:bg-warning/10 dark:text-uk-warn-dark">Vence {vence}</span>
                                                    ) : null}
                                                </span>
                                                <span className="text-xs text-uk-muted dark:text-uk-muted-dark">
                                                    {row.funnel}
                                                    {row.estado === 'PERDIDA' && row.motivoPerdida ? ` · ${row.motivoPerdida}` : ''}
                                                </span>
                                            </div>
                                        );
                                    },
                                },
                                {
                                    accessor: 'estado',
                                    title: 'Estado',
                                    sortable: true,
                                    render: ({ estado }: OportunidadRow) => <EstadoChip label={estadoOportunidadConfig[estado].label} color={estadoOportunidadConfig[estado].color} />,
                                },
                                {
                                    accessor: 'valorEstimado',
                                    title: 'Valor',
                                    sortable: true,
                                    titleClassName: 'text-right',
                                    render: ({ valorEstimado, moneda }: OportunidadRow) =>
                                        valorEstimado != null ? (
                                            <div className="text-right font-extrabold tabular-nums text-uk-money dark:text-uk-money-dark">{formatearMonto(valorEstimado, moneda)}</div>
                                        ) : (
                                            <div className="text-right text-uk-muted dark:text-uk-muted-dark">— Sin valor</div>
                                        ),
                                },
                                {
                                    accessor: 'acciones',
                                    title: <span className="sr-only">Acciones</span>,
                                    sortable: false,
                                    width: 182,
                                    render: (row: OportunidadRow) => {
                                        const destino = row.estado === 'ABIERTA' ? etapaSiguiente(row, etapas) : null;
                                        return (
                                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                {destino ? (
                                                    <button
                                                        type="button"
                                                        title={`Avanzar a ${destino.nombre}`}
                                                        disabled={avanzandoId !== null}
                                                        onClick={() => avanzar(row)}
                                                        className="btn btn-outline-primary h-[34px] w-[112px] rounded-[9px] px-0 text-[13px] font-extrabold shadow-none dark:!border-uk-link-dark dark:!text-uk-link-dark"
                                                    >
                                                        {avanzandoId === row.id ? 'Guardando…' : 'Avanzar →'}
                                                    </button>
                                                ) : null}
                                                <Dropdown
                                                    placement="bottom-end"
                                                    offset={[0, 6]}
                                                    btnClassName="grid h-[34px] w-[34px] place-content-center rounded-[9px] border border-uk-line bg-white text-uk-muted hover:bg-uk-col dark:border-uk-line-dark dark:bg-transparent dark:text-uk-muted-dark dark:hover:bg-white/5"
                                                    aria-label="Más acciones"
                                                    title="Más acciones"
                                                    button={<IconHorizontalDots className="h-4 w-4" />}
                                                >
                                                    <div role="menu" className="w-[196px] rounded-xl border border-uk-line bg-white p-1.5 shadow-[0_8px_24px_rgba(30,15,40,.16)] dark:border-uk-line-dark dark:bg-uk-card-raised-dark dark:shadow-[0_16px_32px_rgba(0,0,0,.5)]">
                                                        <Link role="menuitem" href={`/oportunidades/${row.id}`} className={claseItemMenu}>
                                                            Ver detalle
                                                        </Link>
                                                        {row.estado === 'ABIERTA' ? (
                                                            <Link role="menuitem" href={`/oportunidades/${row.id}/editar`} className={claseItemMenu}>
                                                                Editar
                                                            </Link>
                                                        ) : null}
                                                        {puedeReasignar && row.estado === 'ABIERTA' ? (
                                                            <button type="button" role="menuitem" className={claseItemMenu} onClick={() => reasignar(row)}>
                                                                Reasignar
                                                            </button>
                                                        ) : null}
                                                        <span role="separator" className="my-1 block h-px bg-uk-line dark:bg-uk-line-dark" />
                                                        <button
                                                            type="button"
                                                            role="menuitem"
                                                            className="flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13px] font-extrabold text-uk-lost hover:bg-[#FDECEE] dark:text-uk-lost-dark dark:hover:bg-danger/10"
                                                            onClick={() => darDeBaja(row)}
                                                        >
                                                            Dar de baja
                                                        </button>
                                                    </div>
                                                </Dropdown>
                                            </div>
                                        );
                                    },
                                },
                            ]}
                            highlightOnHover
                            totalRecords={filtradas.length}
                            recordsPerPage={pageSize}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            recordsPerPageLabel="Por página"
                            page={page}
                            onPageChange={(p: number) => setPage(p)}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            paginationText={({ from, to, totalRecords }: any) => `Mostrando ${from}–${to} de ${totalRecords}`}
                            noRecordsText="Ninguna oportunidad coincide con la búsqueda."
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default OportunidadesList;
