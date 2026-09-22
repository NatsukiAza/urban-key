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
import IconLayoutGrid from '@/components/Icon/IconLayoutGrid';
import { darDeBajaOportunidad } from '@/lib/oportunidad/actions';
import { showToast } from '@/lib/ui/toast';
import { estadoOportunidadConfig, estadoOportunidadOptions } from '@/lib/enums/estadoOportunidad';
import type { OportunidadRow, FiltroOportunidades } from '@/lib/oportunidad/types';
import type { Usuario, Funnel, Origen } from '@/lib/dominio';
import PageSizeSelect from '@/components/PageSizeSelect';

const DataTable = dynamic(() => import('mantine-datatable').then((mod) => mod.DataTable), { ssr: false }) as any;

interface Props {
    rows: OportunidadRow[];
    filtro: FiltroOportunidades;
    usuarios: Usuario[];
    funnels: Funnel[];
    origenes: Origen[];
}

const OportunidadesList = ({ rows, filtro, usuarios, funnels, origenes }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Oportunidades'));
    });

    const showMessage = (msg = '', type: any = 'success') => showToast(msg, type);

    const aplicarFiltro = (campo: keyof FiltroOportunidades, valor: string) => {
        const next = new URLSearchParams();
        const merged: any = { ...filtro, [campo]: valor || undefined };
        Object.entries(merged).forEach(([k, v]) => {
            if (v) next.set(k, String(v));
        });
        router.push(`/oportunidades${next.toString() ? `?${next.toString()}` : ''}`);
    };

    const eliminar = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Dar de baja la oportunidad?',
            text: 'Se conserva el historial (baja lógica).',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Dar de baja',
            cancelButtonText: 'Cancelar',
            padding: '2em',
        });
        if (!result.isConfirmed) return;
        const res = await darDeBajaOportunidad(id);
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
    const [initialRecords, setInitialRecords] = useState<OportunidadRow[]>(sortBy(rows, 'titulo'));
    const [records, setRecords] = useState<OportunidadRow[]>(initialRecords);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'titulo', direction: 'asc' });

    useEffect(() => {
        setInitialRecords(sortBy(rows, 'titulo'));
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
            sortBy(rows, 'titulo').filter((item) => {
                const q = search.toLowerCase();
                return (
                    item.titulo.toLowerCase().includes(q) ||
                    item.contacto.toLowerCase().includes(q) ||
                    (item.inmueble ?? '').toLowerCase().includes(q) ||
                    item.responsable.toLowerCase().includes(q) ||
                    item.funnel.toLowerCase().includes(q) ||
                    item.etapa.toLowerCase().includes(q)
                );
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
                        <Link href="/oportunidades/nuevo" className="btn btn-primary gap-2">
                            <IconPlus />
                            Nueva
                        </Link>
                        <Link href="/oportunidades/tablero" className="btn btn-outline-primary gap-2">
                            <IconLayoutGrid className="w-4.5 h-4.5" />
                            Tablero
                        </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 ltr:ml-auto rtl:mr-auto">
                        <select className="form-select w-auto" value={filtro.funnelId ?? ''} onChange={(e) => aplicarFiltro('funnelId', e.target.value)}>
                            <option value="">Todos los funnels</option>
                            {funnels.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.nombre}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto" value={filtro.responsableId ?? ''} onChange={(e) => aplicarFiltro('responsableId', e.target.value)}>
                            <option value="">Todos los responsables</option>
                            {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.nombre} {u.apellido}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto" value={filtro.estado ?? ''} onChange={(e) => aplicarFiltro('estado', e.target.value)}>
                            <option value="">Todos los estados</option>
                            {estadoOportunidadOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto" value={filtro.origenId ?? ''} onChange={(e) => aplicarFiltro('origenId', e.target.value)}>
                            <option value="">Todos los orígenes</option>
                            {origenes.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.nombre}
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
                                accessor: 'titulo',
                                title: 'Título',
                                sortable: true,
                                render: ({ id, titulo }: OportunidadRow) => (
                                    <Link href={`/oportunidades/${id}`}>
                                        <div className="text-primary underline hover:no-underline font-semibold">{titulo}</div>
                                    </Link>
                                ),
                            },
                            { accessor: 'contacto', title: 'Interesado', sortable: true },
                            { accessor: 'inmueble', title: 'Inmueble', sortable: true, render: ({ inmueble }: OportunidadRow) => <span>{inmueble ?? '—'}</span> },
                            { accessor: 'responsable', title: 'Responsable', sortable: true },
                            { accessor: 'funnel', title: 'Funnel', sortable: true },
                            { accessor: 'etapa', title: 'Etapa', sortable: true },
                            {
                                accessor: 'estado',
                                title: 'Estado',
                                sortable: true,
                                render: ({ estado }: OportunidadRow) => <span className={`badge badge-outline-${estadoOportunidadConfig[estado].color}`}>{estadoOportunidadConfig[estado].label}</span>,
                            },
                            {
                                accessor: 'valorEstimado',
                                title: 'Valor',
                                sortable: true,
                                titleClassName: 'text-right',
                                render: ({ valorEstimado }: OportunidadRow) => <div className="text-right font-semibold">{valorEstimado != null ? `$${valorEstimado.toLocaleString('es-AR')}` : '—'}</div>,
                            },
                            {
                                accessor: 'action',
                                title: 'Acciones',
                                sortable: false,
                                textAlignment: 'center',
                                render: ({ id }: OportunidadRow) => (
                                    <div className="flex gap-4 items-center w-max mx-auto">
                                        <Link href={`/oportunidades/${id}/editar`} className="flex hover:text-info">
                                            <IconEdit className="w-4.5 h-4.5" />
                                        </Link>
                                        <Link href={`/oportunidades/${id}`} className="flex hover:text-primary">
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
                        paginationText={({ from, to, totalRecords }: any) => `Mostrando ${from} a ${to} de ${totalRecords} oportunidades`}
                        noRecordsText="No hay oportunidades"
                    />
                </div>
            </div>
        </div>
    );
};

export default OportunidadesList;
