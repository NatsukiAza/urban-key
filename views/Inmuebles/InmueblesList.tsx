'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DataTableSortStatus } from 'mantine-datatable';
import { useState, useEffect } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '@/store/themeConfigSlice';
import IconTrashLines from '@/components/Icon/IconTrashLines';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import IconEye from '@/components/Icon/IconEye';
import PageSizeSelect from '@/components/PageSizeSelect';
import { darDeBajaInmueble } from '@/lib/inmueble/actions';
import { showToast } from '@/lib/ui/toast';
import { tipoOperacionConfig, tipoOperacionOptions } from '@/lib/enums/tipoOperacion';
import { tipoInmuebleConfig, tipoInmuebleOptions } from '@/lib/enums/tipoInmueble';
import { estadoInmuebleConfig, estadoInmuebleOptions } from '@/lib/enums/estadoInmueble';
import { formatearImporte } from '@/lib/enums/moneda';
import type { InmuebleRow, FiltroInmuebles } from '@/lib/inmueble/types';

const DataTable = dynamic(() => import('mantine-datatable').then((mod) => mod.DataTable), { ssr: false }) as any;

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
        <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
            <div className="invoice-table">
                <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                    <div className="flex items-center gap-2">
                        <Link href="/inmuebles/nuevo" className="btn btn-primary gap-2">
                            <IconPlus />
                            Nuevo
                        </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 ltr:ml-auto rtl:mr-auto">
                        <select className="form-select w-auto" value={filtro.tipoOperacion ?? ''} onChange={(e) => aplicarFiltro('tipoOperacion', e.target.value)}>
                            <option value="">Toda operación</option>
                            {tipoOperacionOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto" value={filtro.tipoInmueble ?? ''} onChange={(e) => aplicarFiltro('tipoInmueble', e.target.value)}>
                            <option value="">Todo tipo</option>
                            {tipoInmuebleOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto" value={filtro.estado ?? ''} onChange={(e) => aplicarFiltro('estado', e.target.value)}>
                            <option value="">Todos los estados</option>
                            {estadoInmuebleOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto" value={filtro.localidad ?? ''} onChange={(e) => aplicarFiltro('localidad', e.target.value)} disabled={localidades.length === 0}>
                            <option value="">Todas las localidades</option>
                            {localidades.map((l) => (
                                <option key={l} value={l}>
                                    {l}
                                </option>
                            ))}
                        </select>
                        <input type="text" className="form-input w-auto" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        <PageSizeSelect value={pageSize} options={PAGE_SIZES} onChange={setPageSize} />
                    </div>
                </div>

                <div className="datatables pagination-padding">
                    <DataTable
                        className="whitespace-nowrap table-hover invoice-table"
                        records={records}
                        columns={[
                            {
                                accessor: 'direccion',
                                title: 'Dirección',
                                sortable: true,
                                render: ({ id, direccion, localidad }: InmuebleRow) => (
                                    <Link href={`/inmuebles/${id}`}>
                                        <div className="text-primary underline hover:no-underline font-semibold">{direccion}</div>
                                        {localidad && <div className="text-white-dark text-xs">{localidad}</div>}
                                    </Link>
                                ),
                            },
                            { accessor: 'propietario', title: 'Propietario', sortable: true },
                            {
                                accessor: 'tipoInmueble',
                                title: 'Tipo',
                                sortable: true,
                                render: ({ tipoInmueble }: InmuebleRow) => <span className={`badge badge-outline-${tipoInmuebleConfig[tipoInmueble].color}`}>{tipoInmuebleConfig[tipoInmueble].label}</span>,
                            },
                            {
                                accessor: 'tipoOperacion',
                                title: 'Operación',
                                sortable: true,
                                render: ({ tipoOperacion }: InmuebleRow) => (
                                    <span className={`badge badge-outline-${tipoOperacionConfig[tipoOperacion].color}`}>{tipoOperacionConfig[tipoOperacion].label}</span>
                                ),
                            },
                            {
                                accessor: 'ambientes',
                                title: 'Amb. / Dorm.',
                                sortable: true,
                                render: ({ ambientes, dormitorios }: InmuebleRow) => <span>{`${ambientes ?? '—'} / ${dormitorios ?? '—'}`}</span>,
                            },
                            {
                                accessor: 'm2',
                                title: 'm²',
                                sortable: true,
                                titleClassName: 'text-right',
                                render: ({ m2 }: InmuebleRow) => <div className="text-right">{m2 != null ? m2.toLocaleString('es-AR') : '—'}</div>,
                            },
                            {
                                accessor: 'precio',
                                title: 'Precio',
                                sortable: true,
                                titleClassName: 'text-right',
                                render: ({ precio, moneda }: InmuebleRow) => <div className="text-right font-semibold">{formatearImporte(precio, moneda)}</div>,
                            },
                            {
                                accessor: 'estado',
                                title: 'Estado',
                                sortable: true,
                                render: ({ estado }: InmuebleRow) => <span className={`badge badge-outline-${estadoInmuebleConfig[estado].color}`}>{estadoInmuebleConfig[estado].label}</span>,
                            },
                            {
                                accessor: 'action',
                                title: 'Acciones',
                                sortable: false,
                                textAlignment: 'center',
                                render: ({ id }: InmuebleRow) => (
                                    <div className="flex gap-4 items-center w-max mx-auto">
                                        <Link href={`/inmuebles/${id}/editar`} className="flex hover:text-info">
                                            <IconEdit className="w-4.5 h-4.5" />
                                        </Link>
                                        <Link href={`/inmuebles/${id}`} className="flex hover:text-primary">
                                            <IconEye />
                                        </Link>
                                        <button type="button" className="flex hover:text-danger" onClick={() => eliminar(id)}>
                                            <IconTrashLines />
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        highlightOnHover
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p: number) => setPage(p)}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        paginationText={({ from, to, totalRecords }: any) => `Mostrando ${from} a ${to} de ${totalRecords} inmuebles`}
                        noRecordsText="No hay inmuebles"
                    />
                </div>
            </div>
        </div>
    );
};

export default InmueblesList;
