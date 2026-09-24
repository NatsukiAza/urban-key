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
import { cambiarEtapa, darDeBajaOportunidad } from '@/lib/oportunidad/actions';
import { showToast } from '@/lib/ui/toast';
import { estadoOportunidadConfig, estadoOportunidadOptions } from '@/lib/enums/estadoOportunidad';
import { formatearImporte } from '@/lib/enums/moneda';
import type { OportunidadRow, FiltroOportunidades } from '@/lib/oportunidad/types';
import type { Usuario, Funnel, Origen, Etapa, MotivoPerdida } from '@/lib/dominio';
import OportunidadesTableSkeleton from '@/views/Oportunidades/OportunidadesTableSkeleton';
import PageHeader, { contar } from '@/components/ui/PageHeader';

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
}

const etapaSiguiente = (row: OportunidadRow, etapas: Etapa[]) => {
    const delFunnel = etapas.filter((etapa) => etapa.funnelId === row.funnelId).sort((a, b) => a.orden - b.orden);
    const actual = delFunnel.find((etapa) => etapa.id === row.etapaId);
    if (!actual) return null;
    return delFunnel.find((etapa) => etapa.orden > actual.orden) ?? null;
};

const OportunidadesList = ({ rows, filtro, usuarios, funnels, origenes, etapas, motivosPerdida }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Oportunidades'));
    });

    const showMessage = (msg = '', type: any = 'success') => showToast(msg, type);

    const [avanzandoId, setAvanzandoId] = useState<string | null>(null);

    const aplicarFiltro = (campo: keyof FiltroOportunidades, valor: string) => {
        const next = new URLSearchParams();
        const merged: Record<string, string | undefined> = { ...filtro, [campo]: valor || undefined };
        if (campo === 'funnelId' && merged.etapaId) {
            const etapa = etapas.find((item) => item.id === merged.etapaId);
            if (valor && etapa && etapa.funnelId !== valor) merged.etapaId = undefined;
        }
        Object.entries(merged).forEach(([k, v]) => {
            if (v) next.set(k, String(v));
        });
        router.push(`/oportunidades${next.toString() ? `?${next.toString()}` : ''}`);
    };

    const avanzar = async (row: OportunidadRow) => {
        const destino = etapaSiguiente(row, etapas);
        if (!destino || avanzandoId) return;

        let motivoPerdidaId: string | null = null;
        if (destino.resultado === 'GANADA') {
            const { isConfirmed } = await Swal.fire({
                title: '¿Cerrar como ganada?',
                text: `La oportunidad pasa a “${destino.nombre}” y queda cerrada.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Avanzar',
                cancelButtonText: 'Cancelar',
                padding: '2em',
            });
            if (!isConfirmed) return;
        }
        if (destino.resultado === 'PERDIDA') {
            const opciones = motivosPerdida.reduce((acc: Record<string, string>, motivo) => ({ ...acc, [motivo.id]: motivo.nombre }), {});
            const { value, isConfirmed } = await Swal.fire({
                title: 'Motivo de pérdida',
                input: 'select',
                inputOptions: opciones,
                inputPlaceholder: 'Seleccionar motivo',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                inputValidator: (v) => (!v ? 'Tenés que elegir un motivo' : undefined),
            });
            if (!isConfirmed) return;
            motivoPerdidaId = value;
        }

        setAvanzandoId(row.id);
        const res = await cambiarEtapa({
            oportunidadId: row.id,
            etapaId: destino.id,
            motivoPerdidaId,
            observacion: 'Avance desde el listado',
        });
        setAvanzandoId(null);
        showMessage(res.mensaje, res.ok ? 'success' : 'error');
        if (res.ok) router.refresh();
    };

    const etapasVisibles = (filtro.funnelId ? etapas.filter((etapa) => etapa.funnelId === filtro.funnelId) : [...etapas]).sort((a, b) => {
        if (!filtro.funnelId) {
            const fa = funnels.find((funnel) => funnel.id === a.funnelId)?.nombre ?? '';
            const fb = funnels.find((funnel) => funnel.id === b.funnelId)?.nombre ?? '';
            const porFunnel = fa.localeCompare(fb, 'es');
            if (porFunnel !== 0) return porFunnel;
        }
        return a.orden - b.orden;
    });

    const etiquetaEtapa = (etapa: Etapa) => {
        if (filtro.funnelId) return etapa.nombre;
        const funnel = funnels.find((item) => item.id === etapa.funnelId)?.nombre ?? '';
        return `${funnel} — ${etapa.nombre}`;
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

    const hayFiltro = Boolean(filtro.funnelId || filtro.etapaId || filtro.responsableId || filtro.estado || filtro.origenId);

    return (
        <div>
            <PageHeader
                title="Oportunidades"
                description={contar(rows.length, 'oportunidad', 'oportunidades')}
                actions={
                    <>
                        <Link href="/oportunidades/nuevo" className="btn btn-primary gap-2">
                            <IconPlus />
                            Nueva
                        </Link>
                        <Link href="/oportunidades/tablero" className="btn btn-outline-primary gap-2">
                            <IconLayoutGrid className="w-4.5 h-4.5" />
                            Tablero
                        </Link>
                    </>
                }
            />
        <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
            <div className="invoice-table">
                <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-white-light px-5 pb-4 dark:border-[#1b2e4b]">
                    <input type="text" className="form-input w-full shrink-0 sm:w-56" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="flex flex-wrap items-center gap-2">
                        <select className="form-select w-auto shrink-0 min-w-[175px]" value={filtro.funnelId ?? ''} onChange={(e) => aplicarFiltro('funnelId', e.target.value)}>
                            <option value="">Todos los funnels</option>
                            {funnels.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.nombre}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto shrink-0 min-w-[200px]" value={filtro.etapaId ?? ''} onChange={(e) => aplicarFiltro('etapaId', e.target.value)}>
                            <option value="">Todas las etapas</option>
                            {etapasVisibles.map((etapa) => (
                                <option key={etapa.id} value={etapa.id}>
                                    {etiquetaEtapa(etapa)}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto shrink-0 min-w-[200px]" value={filtro.responsableId ?? ''} onChange={(e) => aplicarFiltro('responsableId', e.target.value)}>
                            <option value="">Todos los responsables</option>
                            {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.nombre} {u.apellido}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto shrink-0 min-w-[175px]" value={filtro.estado ?? ''} onChange={(e) => aplicarFiltro('estado', e.target.value)}>
                            <option value="">Todos los estados</option>
                            {estadoOportunidadOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <select className="form-select w-auto shrink-0 min-w-[185px]" value={filtro.origenId ?? ''} onChange={(e) => aplicarFiltro('origenId', e.target.value)}>
                            <option value="">Todos los orígenes</option>
                            {origenes.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {rows.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <p className="text-white-dark">{hayFiltro ? 'Ninguna oportunidad coincide con los filtros.' : 'Todavía no hay oportunidades.'}</p>
                        <Link href="/oportunidades/nuevo" className="btn btn-primary mt-4 inline-flex">
                            Nueva oportunidad
                        </Link>
                    </div>
                ) : (
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
                                render: ({ valorEstimado, moneda }: OportunidadRow) => <div className="text-right font-semibold text-gold-dark">{formatearImporte(valorEstimado, moneda)}</div>,
                            },
                            {
                                accessor: 'action',
                                title: 'Acciones',
                                sortable: false,
                                textAlignment: 'center',
                                render: (row: OportunidadRow) => {
                                    const destino = row.estado === 'ABIERTA' ? etapaSiguiente(row, etapas) : null;
                                    return (
                                    <div className="flex gap-4 items-center w-max mx-auto">
                                        {destino && (
                                            <button type="button" className="btn btn-sm btn-outline-primary" disabled={avanzandoId !== null} onClick={() => avanzar(row)}>
                                                {avanzandoId === row.id ? 'Guardando...' : `Avanzar a ${destino.nombre}`}
                                            </button>
                                        )}
                                        <Link href={`/oportunidades/${row.id}/editar`} className="flex hover:text-info" aria-label="Editar" title="Editar">
                                            <IconEdit className="w-4.5 h-4.5" />
                                        </Link>
                                        <Link href={`/oportunidades/${row.id}`} className="flex hover:text-primary" aria-label="Ver" title="Ver">
                                            <IconEye />
                                        </Link>
                                        <button type="button" className="flex hover:text-danger" aria-label="Dar de baja" title="Dar de baja" onClick={() => eliminar(row.id)}>
                                            <IconTrashLines />
                                        </button>
                                    </div>
                                    );
                                },
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
                        paginationText={({ from, to, totalRecords }: any) => `Mostrando ${from} a ${to} de ${totalRecords} oportunidades`}
                        noRecordsText="Ninguna oportunidad coincide con la búsqueda."
                    />
                </div>
                )}
            </div>
        </div>
        </div>
    );
};

export default OportunidadesList;
