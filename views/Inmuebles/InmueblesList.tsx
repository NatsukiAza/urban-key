'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect, useMemo, useTransition, type ReactElement } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import IconPlus from '@/components/Icon/IconPlus';
import IconSearch from '@/components/Icon/IconSearch';
import IconHome from '@/components/Icon/IconHome';
import IconBuilding from '@/components/Icon/IconBuilding';
import { darDeBajaInmueble } from '@/lib/inmueble/actions';
import { showToast } from '@/lib/ui/toast';
import { modalDarDeBaja } from '@/lib/ui/modales';
import { tipoOperacionConfig, tipoOperacionOptions } from '@/lib/enums/tipoOperacion';
import { tipoInmuebleConfig, tipoInmuebleOptions, type TipoInmueble } from '@/lib/enums/tipoInmueble';
import { estadoInmuebleConfig, estadoInmuebleOptions } from '@/lib/enums/estadoInmueble';
import { formatearMonto } from '@/lib/enums/moneda';
import type { InmuebleRow, FiltroInmuebles } from '@/lib/inmueble/types';
import InmueblesTableSkeleton from '@/views/Inmuebles/InmueblesTableSkeleton';
import PageHeader, { contar } from '@/components/ui/PageHeader';
import Iniciales from '@/components/ui/Iniciales';
import EstadoChip from '@/components/ui/EstadoChip';
import ChipCategoria from '@/components/ui/ChipCategoria';
import EstadoPantalla from '@/components/ui/EstadoPantalla';
import Select from '@/components/ui/Select';
import MasFiltros from '@/components/ui/MasFiltros';
import ChipsFiltros, { type ChipFiltro } from '@/components/ui/ChipsFiltros';
import MenuFilaTabla from '@/components/ui/MenuFilaTabla';

const iconoTipo: Record<TipoInmueble, ReactElement> = {
    CASA: <IconHome className="h-3.5 w-3.5" duotone={false} />,
    DEPARTAMENTO: <IconBuilding className="h-3.5 w-3.5" />,
    PH: <IconBuilding className="h-3.5 w-3.5" />,
};

const OperacionTipoChip = ({ tipoOperacion, tipoInmueble }: Pick<InmuebleRow, 'tipoOperacion' | 'tipoInmueble'>) => (
    <span className="inline-flex items-center gap-1.5">
        <ChipCategoria destacado>{tipoOperacionConfig[tipoOperacion].label}</ChipCategoria>
        <ChipCategoria>
            {iconoTipo[tipoInmueble]}
            {tipoInmuebleConfig[tipoInmueble].label}
        </ChipCategoria>
    </span>
);

const distribucion = (ambientes: number | null, dormitorios: number | null) => {
    if (ambientes == null) return <span className="text-uk-muted dark:text-uk-muted-dark">—</span>;
    if (ambientes === 1) return <span>Monoamb.</span>;
    return (
        <span>
            {ambientes} amb.
            {dormitorios != null ? <span className="text-uk-muted dark:text-uk-muted-dark"> · {dormitorios} dorm.</span> : null}
        </span>
    );
};

const DataTable = dynamic(() => import('mantine-datatable').then((mod) => mod.DataTable), {
    ssr: false,
    loading: () => <InmueblesTableSkeleton soloFilas />,
}) as any;

interface Props {
    rows: InmuebleRow[];
    filtro: FiltroInmuebles;
    localidades: string[];
}

const PAGE_SIZES = [10, 20, 30, 50];

const InmueblesList = ({ rows, filtro, localidades }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [navegando, iniciarNavegacion] = useTransition();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'direccion', direction: 'asc' });

    useEffect(() => {
        dispatch(setPageTitle('Inmuebles'));
    }, [dispatch]);

    const aplicarFiltros = (cambios: Partial<Record<keyof FiltroInmuebles, string>>) => {
        const next = new URLSearchParams();
        const merged: Record<string, unknown> = { ...filtro, ...cambios };
        Object.entries(merged).forEach(([k, v]) => {
            if (v) next.set(k, String(v));
        });
        iniciarNavegacion(() => router.push(`/inmuebles${next.toString() ? `?${next.toString()}` : ''}`));
    };
    const aplicarFiltro = (campo: keyof FiltroInmuebles, valor: string) => aplicarFiltros({ [campo]: valor });

    const dejarDeBaja = async (id: string, direccion: string) => {
        const confirmado = await modalDarDeBaja(direccion, 'Se conserva el historial. No se puede si tiene oportunidades abiertas.');
        if (!confirmado) return;
        const res = await darDeBajaInmueble(id);
        showToast(res.mensaje ?? '', res.ok ? 'success' : 'error');
        if (res.ok) router.refresh();
    };

    const visibles = useMemo(() => {
        const q = search.trim().toLowerCase();
        const base = q ? rows.filter((r) => r.direccion.toLowerCase().includes(q) || (r.localidad ?? '').toLowerCase().includes(q) || r.propietario.toLowerCase().includes(q)) : rows;
        const ordenados = sortBy(base, (r) => {
            const v = r[sortStatus.columnAccessor as keyof InmuebleRow];
            return typeof v === 'string' ? v.toLowerCase() : v ?? '';
        });
        return sortStatus.direction === 'desc' ? ordenados.reverse() : ordenados;
    }, [rows, search, sortStatus]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, search, sortStatus, rows]);

    const records = useMemo(() => visibles.slice((page - 1) * pageSize, page * pageSize), [visibles, page, pageSize]);

    const ocultosActivos = [filtro.estado, filtro.localidad].filter(Boolean).length;
    const totalActivos = ocultosActivos + [filtro.tipoOperacion, filtro.tipoInmueble].filter(Boolean).length;
    const hayFiltros = totalActivos > 0 || search.trim() !== '';

    const limpiarTodo = () => {
        setSearch('');
        if (totalActivos > 0) iniciarNavegacion(() => router.push('/inmuebles'));
    };

    const chips: ChipFiltro[] = [];
    if (filtro.estado) chips.push({ clave: 'estado', etiqueta: 'Estado', texto: estadoInmuebleConfig[filtro.estado].label });
    if (filtro.localidad) chips.push({ clave: 'localidad', etiqueta: 'Localidad', texto: filtro.localidad });

    const selectOperacion = (
        <Select
            ariaLabel="Operación"
            className="w-full sm:w-[160px]"
            value={filtro.tipoOperacion ?? ''}
            onChange={(v) => aplicarFiltro('tipoOperacion', v)}
            opciones={[{ value: '', label: 'Toda operación' }, ...tipoOperacionOptions.map((o) => ({ value: o.value, label: o.label }))]}
        />
    );
    const selectTipo = (
        <Select
            ariaLabel="Tipo"
            className="w-full sm:w-[150px]"
            value={filtro.tipoInmueble ?? ''}
            onChange={(v) => aplicarFiltro('tipoInmueble', v)}
            opciones={[{ value: '', label: 'Todo tipo' }, ...tipoInmuebleOptions.map((o) => ({ value: o.value, label: o.label }))]}
        />
    );

    const nuevo = (
        <Link href="/inmuebles/nuevo" className="btn btn-primary h-[42px] gap-2 rounded-[10px]">
            <IconPlus />
            Nuevo inmueble
        </Link>
    );

    const sinDatos = rows.length === 0 && totalActivos === 0;
    const sinResultados = !sinDatos && visibles.length === 0;

    return (
        <div>
            <PageHeader title="Inmuebles" description={contar(rows.length, 'inmueble', 'inmuebles')} actions={nuevo} />

            <div className="panel !rounded-[14px] !p-0 shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:!border dark:!border-[#232C45] dark:!bg-uk-card-dark dark:shadow-none">
                <div className="flex flex-col gap-3 border-b border-uk-line px-5 py-4 dark:border-[#232C45]">
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="relative !mb-0 flex h-[38px] w-full items-center sm:w-auto sm:min-w-[240px] sm:flex-1 sm:max-w-[320px]">
                            <span className="sr-only">Buscar inmuebles</span>
                            <IconSearch className="pointer-events-none absolute left-3 h-4 w-4 text-uk-muted dark:text-uk-muted-dark" />
                            <input
                                type="search"
                                className="form-input h-[38px] w-full rounded-[9px] pl-9 text-[13px] dark:!bg-uk-page-dark"
                                placeholder="Buscar por dirección o propietario"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </label>
                        <div className="hidden items-center gap-2 sm:flex">
                            {selectOperacion}
                            {selectTipo}
                        </div>
                        <MasFiltros
                            cantidad={ocultosActivos}
                            cantidadTotal={totalActivos}
                            soloMobile={
                                <>
                                    {selectOperacion}
                                    {selectTipo}
                                </>
                            }
                        >
                            <Select
                                ariaLabel="Estado"
                                className="w-full"
                                value={filtro.estado ?? ''}
                                onChange={(v) => aplicarFiltro('estado', v)}
                                opciones={[{ value: '', label: 'Todos los estados' }, ...estadoInmuebleOptions.map((o) => ({ value: o.value, label: o.label }))]}
                            />
                            <Select
                                ariaLabel="Localidad"
                                className="w-full"
                                disabled={localidades.length === 0}
                                value={filtro.localidad ?? ''}
                                onChange={(v) => aplicarFiltro('localidad', v)}
                                opciones={[{ value: '', label: 'Todas las localidades' }, ...localidades.map((l) => ({ value: l, label: l }))]}
                            />
                        </MasFiltros>
                    </div>
                    <ChipsFiltros chips={chips} onQuitar={(clave) => aplicarFiltro(clave as keyof FiltroInmuebles, '')} onLimpiar={() => aplicarFiltros({ estado: '', localidad: '', tipoOperacion: '', tipoInmueble: '' })} />
                </div>

                {navegando ? (
                    <InmueblesTableSkeleton soloFilas />
                ) : sinDatos ? (
                    <div className="px-5 py-5">
                        <EstadoPantalla
                            variante="vacio"
                            icono={<IconHome className="h-7 w-7" duotone={false} />}
                            titulo="Todavía no cargaste inmuebles"
                            descripcion="Cargá el primero para poder asociarlo a oportunidades."
                            acciones={nuevo}
                        />
                    </div>
                ) : sinResultados ? (
                    <div className="px-5 py-5">
                        <EstadoPantalla
                            variante="vacio"
                            icono={<IconSearch className="h-7 w-7" />}
                            titulo="Ningún inmueble coincide"
                            descripcion={hayFiltros ? 'Probá con otra búsqueda o quitá algún filtro.' : ''}
                            acciones={
                                <button type="button" className="btn btn-cancel h-10 rounded-[10px]" onClick={limpiarTodo}>
                                    Limpiar filtros
                                </button>
                            }
                        />
                    </div>
                ) : (
                    <div className="datatables tabla-lista pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={records}
                            minHeight={0}
                            rowClassName="cursor-pointer"
                            onRowClick={(row: InmuebleRow) => router.push(`/inmuebles/${row.id}`)}
                            columns={[
                                {
                                    accessor: 'direccion',
                                    title: 'Propiedad',
                                    sortable: true,
                                    render: ({ id, direccion, localidad }: InmuebleRow) => (
                                        <Link href={`/inmuebles/${id}`} className="block no-underline" onClick={(e) => e.stopPropagation()}>
                                            <div className="font-bold text-primary hover:underline dark:text-uk-link-dark">{direccion}</div>
                                            {localidad && <div className="text-xs text-uk-muted dark:text-uk-muted-dark">{localidad}</div>}
                                        </Link>
                                    ),
                                },
                                {
                                    accessor: 'propietario',
                                    title: 'Propietario',
                                    sortable: true,
                                    render: ({ propietario }: InmuebleRow) => (
                                        <div className="flex items-center gap-2">
                                            <Iniciales nombre={propietario} />
                                            <span>{propietario}</span>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'tipoOperacion',
                                    title: 'Operación & Tipo',
                                    sortable: true,
                                    render: ({ tipoOperacion, tipoInmueble }: InmuebleRow) => <OperacionTipoChip tipoOperacion={tipoOperacion} tipoInmueble={tipoInmueble} />,
                                },
                                {
                                    accessor: 'ambientes',
                                    title: 'Distribución',
                                    sortable: true,
                                    render: ({ ambientes, dormitorios }: InmuebleRow) => distribucion(ambientes, dormitorios),
                                },
                                {
                                    accessor: 'm2',
                                    title: 'Superficie',
                                    sortable: true,
                                    titleClassName: 'text-right',
                                    render: ({ m2 }: InmuebleRow) => <div className="text-right tabular-nums">{m2 != null ? `${m2.toLocaleString('es-AR')} m²` : '—'}</div>,
                                },
                                {
                                    accessor: 'precio',
                                    title: 'Precio',
                                    sortable: true,
                                    titleClassName: 'text-right',
                                    render: ({ precio, moneda }: InmuebleRow) => (
                                        <div className="text-right font-bold tabular-nums text-uk-money dark:text-uk-money-dark">{precio != null ? formatearMonto(precio, moneda) : '—'}</div>
                                    ),
                                },
                                {
                                    accessor: 'estado',
                                    title: 'Estado',
                                    sortable: true,
                                    render: ({ estado }: InmuebleRow) => <EstadoChip label={estadoInmuebleConfig[estado].label} color={estadoInmuebleConfig[estado].color} />,
                                },
                                {
                                    accessor: 'action',
                                    title: <span className="sr-only">Acciones</span>,
                                    sortable: false,
                                    textAlignment: 'right',
                                    render: ({ id, direccion }: InmuebleRow) => (
                                        <div className="flex justify-end">
                                            <MenuFilaTabla
                                                ariaLabel={`Más acciones para ${direccion}`}
                                                items={[
                                                    { etiqueta: 'Ver', href: `/inmuebles/${id}` },
                                                    { etiqueta: 'Editar', href: `/inmuebles/${id}/editar` },
                                                    { etiqueta: 'Dar de baja', destructivo: true, onClick: () => dejarDeBaja(id, direccion) },
                                                ]}
                                            />
                                        </div>
                                    ),
                                },
                            ]}
                            highlightOnHover
                            totalRecords={visibles.length}
                            recordsPerPage={pageSize}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            recordsPerPageLabel="Por página"
                            page={page}
                            onPageChange={(p: number) => setPage(p)}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            paginationText={({ from, to, totalRecords }: any) => `Mostrando ${from}–${to} de ${totalRecords}`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InmueblesList;
