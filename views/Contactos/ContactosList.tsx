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
import { ESTADOS_CONTACTO, estadoLabel, listarContactos, listarContextoContacto, nombreContacto, type Contacto, type ContextoContacto, type EstadoContacto } from '@/lib/supabase/contactos';
import { actualizarContactoAction, darDeBajaContactoAction, reasignarContactoAction } from '@/lib/contacto/actions';
import { puedeReasignar } from '@/lib/auth/permisos';
import { modalDarDeBaja } from '@/lib/ui/modales';
import { pedirReasignacion } from '@/views/Oportunidades/pedirReasignacion';
import { showToast } from '@/lib/ui/toast';
import { formatearTelefono } from '@/lib/formato';
import PageHeader, { contar } from '@/components/ui/PageHeader';
import Iniciales from '@/components/ui/Iniciales';
import ChipCategoria from '@/components/ui/ChipCategoria';
import EstadoPantalla from '@/components/ui/EstadoPantalla';
import Select from '@/components/ui/Select';
import MenuFilaTabla from '@/components/ui/MenuFilaTabla';
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
    const [filtroEstado, setFiltroEstado] = useState<EstadoContacto | ''>('');
    const [filtroRol, setFiltroRol] = useState<'propietario' | 'interesado' | ''>('');
    const [filtroResponsable, setFiltroResponsable] = useState('');
    const [filtroOrigen, setFiltroOrigen] = useState('');
    const [ctx, setCtx] = useState<ContextoContacto | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'nombre', direction: 'asc' });

    useEffect(() => {
        dispatch(setPageTitle('Contactos'));
    }, [dispatch]);

    const cargar = useCallback(() => {
        setCargando(true);
        setError('');
        const supabase = createClient();
        Promise.all([listarContactos(supabase), listarContextoContacto(supabase)]).then(([resultado, contexto]) => {
            if ('error' in resultado) setError(resultado.error);
            else setContactos(resultado.contactos);
            setCtx(contexto);
            setCargando(false);
        });
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    useEffect(() => {
        setPage(1);
    }, [busqueda, filtroEstado, filtroRol, filtroResponsable, filtroOrigen, pageSize, sortStatus]);

    const visibles = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        const base = contactos.filter((c) => {
            if (filtroEstado && c.estado !== filtroEstado) return false;
            if (filtroRol === 'propietario' && !c.es_propietario) return false;
            if (filtroRol === 'interesado' && !c.es_interesado) return false;
            if (filtroResponsable && c.responsable_id !== filtroResponsable) return false;
            if (filtroOrigen && c.origen_id !== filtroOrigen) return false;
            return !q || `${c.nombre} ${c.apellido} ${c.email ?? ''} ${c.telefono ?? ''} ${c.responsable_nombre} ${c.origen_nombre ?? ''}`.toLowerCase().includes(q);
        });
        const ordenados = sortBy(base, (c) => String(c[sortStatus.columnAccessor as keyof Contacto] ?? '').toLowerCase());
        return sortStatus.direction === 'desc' ? ordenados.reverse() : ordenados;
    }, [busqueda, filtroEstado, filtroRol, filtroResponsable, filtroOrigen, contactos, sortStatus]);

    const records = useMemo(() => visibles.slice((page - 1) * pageSize, page * pageSize), [visibles, page, pageSize]);

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroEstado('');
        setFiltroRol('');
        setFiltroResponsable('');
        setFiltroOrigen('');
    };

    const reasigna = Boolean(ctx?.yo && puedeReasignar(ctx.yo.rol));

    const reasignar = async (c: Contacto) => {
        if (!ctx) return;
        const nuevoId = await pedirReasignacion(ctx.usuarios, c.responsable_id);
        if (!nuevoId) return;
        const res = await reasignarContactoAction(c.id, nuevoId);
        showToast(res.mensaje ?? '', res.ok ? 'success' : 'error');
        if (res.ok) cargar();
    };

    const nuevaOportunidad = async (c: Contacto) => {
        const edita = !ctx?.yo || puedeReasignar(ctx.yo.rol) || c.responsable_id === ctx.yo.id;
        if (!c.es_interesado && !edita) {
            showToast('No podés modificar este contacto. Pedile al responsable que lo marque como interesado.', 'error');
            return;
        }
        if (!c.es_interesado) {
            const resultado = await actualizarContactoAction(c.id, {
                nombre: c.nombre,
                apellido: c.apellido,
                email: c.email ?? '',
                telefono: c.telefono ?? '',
                estado: c.estado,
                es_propietario: c.es_propietario,
                es_interesado: true,
                observaciones: c.observaciones ?? '',
            });
            if (!resultado.ok) {
                showToast(resultado.mensaje, 'error');
                return;
            }
            showToast('Lo marcamos como interesado para poder crear la oportunidad.', 'success');
        }
        router.push(`/oportunidades/nuevo?contactoId=${c.id}`);
    };

    const darDeBaja = async (c: Contacto) => {
        const confirmado = await modalDarDeBaja(nombreContacto(c), 'Se conserva el historial comercial. No se puede si tiene oportunidades abiertas.');
        if (!confirmado) return;
        const res = await darDeBajaContactoAction(c.id);
        showToast(res.mensaje ?? '', res.ok ? 'success' : 'error');
        if (res.ok) cargar();
    };

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
                <div className="flex flex-wrap items-center gap-2 border-b border-uk-line px-5 py-4 dark:border-[#232C45]">
                    <label className="relative !mb-0 flex h-[38px] w-full items-center sm:w-auto sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
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
                    <Select
                        ariaLabel="Rol"
                        className="w-full sm:w-[170px]"
                        value={filtroRol}
                        onChange={(v) => setFiltroRol(v as 'propietario' | 'interesado' | '')}
                        opciones={[
                            { value: '', label: 'Todos los roles' },
                            { value: 'propietario', label: 'Propietario' },
                            { value: 'interesado', label: 'Interesado' },
                        ]}
                    />
                    <Select
                        ariaLabel="Estado"
                        className="w-full sm:w-[170px]"
                        value={filtroEstado}
                        onChange={(v) => setFiltroEstado(v as EstadoContacto | '')}
                        opciones={[{ value: '', label: 'Todos los estados' }, ...ESTADOS_CONTACTO.map((e) => ({ value: e, label: estadoLabel[e] }))]}
                    />
                    <Select
                        ariaLabel="Responsable"
                        className="w-full sm:w-[200px]"
                        value={filtroResponsable}
                        onChange={setFiltroResponsable}
                        opciones={[{ value: '', label: 'Todos los responsables' }, ...(ctx?.usuarios ?? []).map((u) => ({ value: u.id, label: `${u.nombre} ${u.apellido}`.trim() }))]}
                    />
                    <Select
                        ariaLabel="Origen"
                        className="w-full sm:w-[180px]"
                        value={filtroOrigen}
                        onChange={setFiltroOrigen}
                        opciones={[{ value: '', label: 'Todos los orígenes' }, ...(ctx?.origenes ?? []).map((o) => ({ value: o.id, label: o.nombre }))]}
                    />
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
                            descripcion={busqueda.trim() ? `No hay resultados para “${busqueda.trim()}”.` : 'Probá quitando alguno de los filtros activos.'}
                            acciones={
                                <button type="button" className="btn btn-cancel h-10 rounded-[10px]" onClick={limpiarFiltros}>
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
                                    accessor: 'rol',
                                    title: 'Rol',
                                    render: (c: Contacto) => {
                                        const roles = [c.es_propietario ? 'Propietario' : null, c.es_interesado ? 'Interesado' : null].filter(Boolean) as string[];
                                        return roles.length > 0 ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                {roles.map((r) => (
                                                    <ChipCategoria key={r} destacado>
                                                        {r}
                                                    </ChipCategoria>
                                                ))}
                                            </span>
                                        ) : (
                                            <span className="text-uk-muted dark:text-uk-muted-dark">—</span>
                                        );
                                    },
                                },
                                {
                                    accessor: 'estado',
                                    title: 'Estado',
                                    sortable: true,
                                    render: (c: Contacto) => <ChipCategoria>{estadoLabel[c.estado]}</ChipCategoria>,
                                },
                                {
                                    accessor: 'responsable_nombre',
                                    title: 'Responsable',
                                    sortable: true,
                                    render: (c: Contacto) => {
                                        const usuario = ctx?.usuarios.find((u) => u.id === c.responsable_id);
                                        const nombre = c.responsable_nombre || (usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() : '');
                                        return nombre || <span className="text-uk-muted dark:text-uk-muted-dark">—</span>;
                                    },
                                },
                                {
                                    accessor: 'origen_nombre',
                                    title: 'Origen',
                                    sortable: true,
                                    render: (c: Contacto) => c.origen_nombre || <span className="text-uk-muted dark:text-uk-muted-dark">—</span>,
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
                                {
                                    accessor: 'acciones',
                                    title: <span className="sr-only">Acciones</span>,
                                    textAlignment: 'right',
                                    width: 70,
                                    render: (c: Contacto) => (
                                        <div className="flex justify-end">
                                            <MenuFilaTabla
                                                ariaLabel={`Más acciones para ${nombreContacto(c)}`}
                                                items={(() => {
                                                    const edita = !ctx?.yo || puedeReasignar(ctx.yo.rol) || c.responsable_id === ctx.yo.id;
                                                    return [
                                                        { etiqueta: 'Ver detalle', href: `/contactos/${c.id}` },
                                                        ...(edita ? [{ etiqueta: 'Editar', href: `/contactos/${c.id}/editar` }] : []),
                                                        { etiqueta: 'Nueva oportunidad', onClick: () => void nuevaOportunidad(c) },
                                                        ...(reasigna ? [{ etiqueta: 'Reasignar', onClick: () => void reasignar(c) }] : []),
                                                        ...(edita ? [{ etiqueta: 'Dar de baja', destructivo: true, onClick: () => void darDeBaja(c) }] : []),
                                                    ];
                                                })()}
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
                            noRecordsText="Ningún contacto coincide con la búsqueda."
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactosList;
