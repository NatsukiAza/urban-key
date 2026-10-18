'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DataTableSortStatus } from 'mantine-datatable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { createClient } from '@/lib/supabase/client';
import { listarContactos, type Contacto } from '@/lib/supabase/contactos';
import { formatearTelefono } from '@/lib/formato';
import PageHeader, { contar } from '@/components/ui/PageHeader';
import Iniciales from '@/components/ui/Iniciales';
import EstadoPantalla from '@/components/ui/EstadoPantalla';
import IconPlus from '@/components/Icon/IconPlus';
import IconSearch from '@/components/Icon/IconSearch';
import IconUsers from '@/components/Icon/IconUsers';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';
import ContactosTableSkeleton from '@/views/Contactos/ContactosTableSkeleton';

const DataTable = dynamic(() => import('mantine-datatable').then((mod) => mod.DataTable), {
    ssr: false,
    loading: () => <ContactosTableSkeleton />,
}) as any;

const PAGE_SIZES = [10, 25, 50];
const claseEnlace = 'text-uk-ink hover:underline dark:text-uk-ink-dark';

const ContactosList = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [contactos, setContactos] = useState<Contacto[]>([]);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'nombre', direction: 'asc' });

    useEffect(() => {
        dispatch(setPageTitle('Contactos'));
    }, [dispatch]);

    const cargar = useCallback(() => {
        setCargando(true);
        setError('');
        listarContactos(createClient()).then((resultado) => {
            if ('error' in resultado) setError(resultado.error);
            else setContactos(resultado.contactos);
            setCargando(false);
        });
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    useEffect(() => {
        setPage(1);
    }, [busqueda, pageSize, sortStatus]);

    const visibles = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        const base = q ? contactos.filter((c) => `${c.nombre} ${c.apellido} ${c.email ?? ''} ${c.telefono ?? ''}`.toLowerCase().includes(q)) : contactos;
        const ordenados = sortBy(base, (c) => String(c[sortStatus.columnAccessor as keyof Contacto] ?? '').toLowerCase());
        return sortStatus.direction === 'desc' ? ordenados.reverse() : ordenados;
    }, [busqueda, contactos, sortStatus]);

    const records = useMemo(() => visibles.slice((page - 1) * pageSize, page * pageSize), [visibles, page, pageSize]);

    const nuevo = (
        <Link href="/contactos/nuevo" className="btn btn-primary h-[42px] gap-2 rounded-[10px]">
            <IconPlus />
            Nuevo contacto
        </Link>
    );

    return (
        <div>
            <PageHeader title="Contactos" description={cargando ? 'Cargando…' : contar(contactos.length, 'contacto', 'contactos')} actions={nuevo} />

            <div className="panel !rounded-[14px] !p-0 shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:!border dark:!border-[#232C45] dark:!bg-uk-card-dark dark:shadow-none">
                <div className="border-b border-uk-line px-5 py-4 dark:border-[#232C45]">
                    <label className="relative !mb-0 flex h-[38px] w-full items-center sm:max-w-[360px]">
                        <span className="sr-only">Buscar contactos</span>
                        <IconSearch className="pointer-events-none absolute left-3 h-4 w-4 text-uk-muted dark:text-uk-muted-dark" />
                        <input
                            type="search"
                            className="form-input h-[38px] w-full rounded-[9px] pl-9 text-[13px] dark:!bg-uk-page-dark"
                            placeholder="Buscar por nombre, email o teléfono"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </label>
                </div>

                {error ? (
                    <div className="px-5 py-5">
                        <EstadoPantalla
                            variante="error"
                            icono={<IconInfoTriangle className="h-7 w-7" />}
                            titulo="No pudimos cargar los contactos"
                            descripcion="Puede ser un problema de conexión. Tus datos no se perdieron."
                            acciones={
                                <button type="button" className="btn btn-primary h-10 rounded-[10px]" onClick={cargar}>
                                    Reintentar
                                </button>
                            }
                        />
                    </div>
                ) : cargando ? (
                    <ContactosTableSkeleton />
                ) : contactos.length === 0 ? (
                    <div className="px-5 py-5">
                        <EstadoPantalla
                            variante="vacio"
                            icono={<IconUsers className="h-7 w-7" duotone={false} />}
                            titulo="Todavía no cargaste contactos"
                            descripcion="Cargá el primero para poder asociarlo a inmuebles y oportunidades."
                            acciones={nuevo}
                        />
                    </div>
                ) : visibles.length === 0 ? (
                    <div className="px-5 py-5">
                        <EstadoPantalla
                            variante="vacio"
                            icono={<IconSearch className="h-7 w-7" />}
                            titulo="Ningún contacto coincide"
                            descripcion={`No hay resultados para “${busqueda.trim()}”.`}
                            acciones={
                                <button type="button" className="btn btn-cancel h-10 rounded-[10px]" onClick={() => setBusqueda('')}>
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
                            idAccessor="id"
                            minHeight={0}
                            rowClassName="cursor-pointer"
                            onRowClick={(c: Contacto) => router.push(`/contactos/${c.id}`)}
                            columns={[
                                {
                                    accessor: 'nombre',
                                    title: 'Nombre',
                                    sortable: true,
                                    render: (c: Contacto) => (
                                        <Link href={`/contactos/${c.id}`} className="flex items-center gap-3 no-underline" onClick={(e) => e.stopPropagation()}>
                                            <Iniciales nombre={c.nombre} apellido={c.apellido} />
                                            <span className="font-bold text-uk-ink hover:underline dark:text-uk-ink-dark">
                                                {c.nombre} {c.apellido}
                                            </span>
                                        </Link>
                                    ),
                                },
                                {
                                    accessor: 'email',
                                    title: 'Email',
                                    sortable: true,
                                    render: (c: Contacto) =>
                                        c.email ? (
                                            <a href={`mailto:${c.email}`} className={claseEnlace} onClick={(e) => e.stopPropagation()}>
                                                {c.email}
                                            </a>
                                        ) : (
                                            <span className="text-uk-muted dark:text-uk-muted-dark">—</span>
                                        ),
                                },
                                {
                                    accessor: 'telefono',
                                    title: 'Teléfono',
                                    sortable: true,
                                    render: (c: Contacto) =>
                                        c.telefono ? (
                                            <a href={`tel:${c.telefono.replace(/[^\d+]/g, '')}`} className={`${claseEnlace} tabular-nums`} onClick={(e) => e.stopPropagation()}>
                                                {formatearTelefono(c.telefono)}
                                            </a>
                                        ) : (
                                            <span className="text-uk-muted dark:text-uk-muted-dark">—</span>
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
                            noRecordsText="Ningún contacto coincide con la búsqueda."
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactosList;
