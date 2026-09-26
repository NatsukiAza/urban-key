'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect, type ReactElement } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '@/store/themeConfigSlice';
import IconTrashLines from '@/components/Icon/IconTrashLines';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import IconEye from '@/components/Icon/IconEye';
import { darDeBajaInmueble } from '@/lib/inmueble/actions';
import { showToast } from '@/lib/ui/toast';
import { tipoOperacionConfig, tipoOperacionOptions } from '@/lib/enums/tipoOperacion';
import { tipoInmuebleConfig, tipoInmuebleOptions } from '@/lib/enums/tipoInmueble';
import { estadoInmuebleConfig, estadoInmuebleOptions } from '@/lib/enums/estadoInmueble';
import { formatearImporte } from '@/lib/enums/moneda';
import type { InmuebleRow, FiltroInmuebles } from '@/lib/inmueble/types';
import InmueblesTableSkeleton from '@/views/Inmuebles/InmueblesTableSkeleton';
import PageHeader, { contar } from '@/components/ui/PageHeader';
import Iniciales from '@/components/ui/Iniciales';
import EstadoChip from '@/components/ui/EstadoChip';
import IconHome from '@/components/Icon/IconHome';
import IconBuilding from '@/components/Icon/IconBuilding';
import type { TipoInmueble } from '@/lib/enums/tipoInmueble';

const chipColor: Record<string, { solido: string; borde: string }> = {
    primary: { solido: 'bg-secondary', borde: 'border-secondary text-secondary' },
    info: { solido: 'bg-info', borde: 'border-info text-info' },
    secondary: { solido: 'bg-secondary', borde: 'border-secondary text-secondary' },
    success: { solido: 'bg-success', borde: 'border-success text-success' },
    warning: { solido: 'bg-warning', borde: 'border-warning text-warning' },
    danger: { solido: 'bg-danger', borde: 'border-danger text-danger' },
};

const iconoTipo: Record<TipoInmueble, ReactElement> = {
    CASA: <IconHome className="h-3.5 w-3.5" duotone={false} />,
    DEPARTAMENTO: <IconBuilding className="h-3.5 w-3.5" />,
    PH: <IconBuilding className="h-3.5 w-3.5" />,
};

const OperacionTipoChip = ({ tipoOperacion, tipoInmueble }: Pick<InmuebleRow, 'tipoOperacion' | 'tipoInmueble'>) => {
    const op = tipoOperacionConfig[tipoOperacion];
    const tipo = tipoInmuebleConfig[tipoInmueble];
    const color = chipColor[op.color] ?? { solido: 'bg-dark', borde: 'border-dark text-dark' };
    return (
        <span className="inline-flex items-stretch text-xs font-semibold">
            <span className={`flex items-center rounded-l px-2 py-1 text-white ${color.solido}`}>{op.label}</span>
            <span className={`flex items-center gap-1 rounded-r border border-l-0 bg-white px-2 py-1 dark:bg-transparent ${color.borde}`}>
                {iconoTipo[tipoInmueble]}
                {tipo.label}
            </span>
        </span>
    );
};

const distribucion = (ambientes: number | null, dormitorios: number | null) => {
    if (ambientes == null) return <span className="text-white-dark">—</span>;
    let sufijo: { texto: string; muteado: boolean };
    if (ambientes === 1) sufijo = { texto: '(Monoamb.)', muteado: true };
    else if (dormitorios == null) sufijo = { texto: 'sin definir dorm.', muteado: true };
    else sufijo = { texto: `· ${dormitorios} dorm`, muteado: false };
    return (
        <span>
            {ambientes} amb <span className={sufijo.muteado ? 'text-white-dark' : ''}>{sufijo.texto}</span>
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

const InmueblesList = ({ rows, filtro, localidades }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Inmuebles'));
    });

    const showMessage = (msg = '', type: any = 'success') => showToast(msg, type);

    const aplicarFiltro = (campo: keyof FiltroInmuebles, valor: string) => {
        const next = new URLSearchParams();
        const merged: any = { ...filtro, [campo]: valor || undefined };
        Object.entries(merged).forEach(([k, v]) => {
            if (v) next.set(k, String(v));
        });
        router.push(`/inmuebles${next.toString() ? `?${next.toString()}` : ''}`);
    };

    const eliminar = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Dar de baja el inmueble?',
            text: 'Se conserva el historial (baja lógica). No se puede si tiene oportunidades abiertas.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Dar de baja',
            cancelButtonText: 'Cancelar',
            padding: '2em',
        });
        if (!result.isConfirmed) return;
        const res = await darDeBajaInmueble(id);
        if (res.ok) {
            showMessage(res.mensaje);
            router.refresh();
        } else {
            showMessage(res.mensaje, 'error');
        }
    };

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [search, setSearch] = useState('');
    const [initialRecords, setInitialRecords] = useState<InmuebleRow[]>(sortBy(rows, 'direccion'));
    const [records, setRecords] = useState<InmuebleRow[]>(initialRecords);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'direccion', direction: 'asc' });

    useEffect(() => {
        setInitialRecords(sortBy(rows, 'direccion'));
    }, [rows]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(
            sortBy(rows, 'direccion').filter((item) => {
                const q = search.toLowerCase();
                return item.direccion.toLowerCase().includes(q) || (item.localidad ?? '').toLowerCase().includes(q) || item.propietario.toLowerCase().includes(q);
            })
        );
    }, [search, rows]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [sortStatus]);

    return (
        <div>
            <PageHeader
                title="Inmuebles"
                description={contar(rows.length, 'inmueble', 'inmuebles')}
                actions={
                    <Link href="/inmuebles/nuevo" className="btn btn-primary gap-2">
                        <IconPlus />
                        Nuevo
                    </Link>
                }
            />
        <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
            <div className="invoice-table">
                <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-white-light px-5 pb-4 dark:border-[#1b2e4b]">
                    <input type="text" className="form-input w-full shrink-0 sm:w-56" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="flex flex-wrap items-center gap-2">
                        <select className="form-select w-auto shrink-0 min-w-[160px]" value={filtro.tipoOperacion ?? ''} onChange={(e) => aplicarFiltro('tipoOperacion', e.target.value)}>
                            <option value="">Toda operación</option>
                            {tipoOperacionOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto shrink-0 min-w-[150px]" value={filtro.tipoInmueble ?? ''} onChange={(e) => aplicarFiltro('tipoInmueble', e.target.value)}>
                            <option value="">Todo tipo</option>
                            {tipoInmuebleOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto shrink-0 min-w-[175px]" value={filtro.estado ?? ''} onChange={(e) => aplicarFiltro('estado', e.target.value)}>
                            <option value="">Todos los estados</option>
                            {estadoInmuebleOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto shrink-0 min-w-[200px]" value={filtro.localidad ?? ''} onChange={(e) => aplicarFiltro('localidad', e.target.value)} disabled={localidades.length === 0}>
                            <option value="">Todas las localidades</option>
                            {localidades.map((l) => (
                                <option key={l} value={l}>
                                    {l}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {rows.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <p className="text-white-dark">{filtro.tipoOperacion || filtro.tipoInmueble || filtro.estado || filtro.localidad ? 'Ningún inmueble coincide con los filtros.' : 'Todavía no hay inmuebles.'}</p>
                        <Link href="/inmuebles/nuevo" className="btn btn-primary mt-4 inline-flex">
                            Cargar inmueble
                        </Link>
                    </div>
                ) : (
                <div className="datatables pagination-padding">
                    <DataTable
                        className="whitespace-nowrap table-hover invoice-table"
                        records={records}
                        columns={[
                            {
                                accessor: 'direccion',
                                title: 'Propiedad',
                                sortable: true,
                                render: ({ id, direccion, localidad }: InmuebleRow) => (
                                    <Link href={`/inmuebles/${id}`}>
                                        <div className="text-primary underline hover:no-underline font-semibold">{direccion}</div>
                                        {localidad && <div className="text-white-dark text-xs">{localidad}</div>}
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
                                render: ({ m2 }: InmuebleRow) => <div className="text-right">{m2 != null ? `${m2.toLocaleString('es-AR')} m²` : '—'}</div>,
                            },
                            {
                                accessor: 'precio',
                                title: 'Precio',
                                sortable: true,
                                titleClassName: 'text-right',
                                render: ({ precio, moneda }: InmuebleRow) => <div className="text-right font-semibold text-gold-dark">{formatearImporte(precio, moneda)}</div>,
                            },
                            {
                                accessor: 'estado',
                                title: 'Estado',
                                sortable: true,
                                render: ({ estado }: InmuebleRow) => <EstadoChip label={estadoInmuebleConfig[estado].label} color={estadoInmuebleConfig[estado].color} />,
                            },
                            {
                                accessor: 'action',
                                title: 'Acciones',
                                sortable: false,
                                textAlignment: 'center',
                                render: ({ id }: InmuebleRow) => (
                                    <div className="flex gap-4 items-center w-max mx-auto">
                                        <Link href={`/inmuebles/${id}/editar`} className="flex hover:text-info" aria-label="Editar" title="Editar">
                                            <IconEdit className="w-4.5 h-4.5" />
                                        </Link>
                                        <Link href={`/inmuebles/${id}`} className="flex hover:text-primary" aria-label="Ver" title="Ver">
                                            <IconEye />
                                        </Link>
                                        <button type="button" className="flex hover:text-danger" aria-label="Dar de baja" title="Dar de baja" onClick={() => eliminar(id)}>
                                            <IconTrashLines />
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        highlightOnHover
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        recordsPerPageLabel="Por página"
                        page={page}
                        onPageChange={(p: number) => setPage(p)}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        paginationText={({ from, to, totalRecords }: any) => `Mostrando ${from} a ${to} de ${totalRecords} inmuebles`}
                        noRecordsText="Ningún inmueble coincide con la búsqueda."
                    />
                </div>
                )}
            </div>
        </div>
        </div>
    );
};

export default InmueblesList;
