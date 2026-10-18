'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import IconPlus from '@/components/Icon/IconPlus';
import IconMapPin from '@/components/Icon/IconMapPin';
import PageHeader, { contar } from '@/components/ui/PageHeader';
import EstadoChip from '@/components/ui/EstadoChip';
import EstadoPantalla from '@/components/ui/EstadoPantalla';
import MenuFilaTabla from '@/components/ui/MenuFilaTabla';
import { formatearTelefono } from '@/lib/formato';
import { actualizarInmobiliaria, crearInmobiliaria } from '@/lib/sucursal/actions';
import { showToast } from '@/lib/ui/toast';
import type { Inmobiliaria, Sucursal } from '@/lib/sucursal/types';

interface Props {
    inmobiliaria: Inmobiliaria | null;
    sucursales: Sucursal[];
    esAdmin: boolean;
}

const DataTable = dynamic(() => import('mantine-datatable').then((mod) => mod.DataTable), { ssr: false }) as any;

const enlaceTel = (t: string) => `tel:${t.replace(/[^\d+]/g, '')}`;

const SucursalesList = ({ inmobiliaria, sucursales, esAdmin }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [nombre, setNombre] = useState('');
    const [cuit, setCuit] = useState('');
    const [editandoOrg, setEditandoOrg] = useState(false);
    const [nombreOrg, setNombreOrg] = useState(inmobiliaria?.nombre ?? '');
    const [cuitOrg, setCuitOrg] = useState(inmobiliaria?.cuit ?? '');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(esAdmin ? 'Sucursales' : 'Tu sucursal'));
    }, [dispatch, esAdmin]);

    const crearOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        const res = await crearInmobiliaria({ nombre, cuit });
        setGuardando(false);
        if (res.ok) {
            showToast(res.mensaje ?? 'Inmobiliaria creada');
            router.refresh();
        } else {
            showToast(res.mensaje, 'error');
        }
    };

    if (!inmobiliaria) {
        return (
            <div className="panel max-w-xl">
                <h2 className="text-xl font-semibold mb-2">Inmobiliaria</h2>
                {esAdmin ? (
                    <>
                        <p className="text-uk-muted dark:text-uk-muted-dark mb-5">Cargá la inmobiliaria una sola vez. Después vas a poder crear sus sucursales y asignar usuarios.</p>
                        <form onSubmit={crearOrg} className="space-y-5">
                            <div>
                                <label htmlFor="nombre">Nombre *</label>
                                <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} type="text" className="form-input" placeholder="Ej: Morón Propiedades" />
                            </div>
                            <div>
                                <label htmlFor="cuit">CUIT</label>
                                <input id="cuit" value={cuit} onChange={(e) => setCuit(e.target.value)} type="text" className="form-input" placeholder="Opcional" />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="btn btn-primary" disabled={guardando}>
                                    {guardando ? 'Guardando…' : 'Crear inmobiliaria'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <p className="text-uk-muted dark:text-uk-muted-dark">Todavía no hay una inmobiliaria cargada. Pedile a un administrador que la dé de alta.</p>
                )}
            </div>
        );
    }

    const guardarOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        const res = await actualizarInmobiliaria(inmobiliaria.id, { nombre: nombreOrg, cuit: cuitOrg });
        setGuardando(false);
        if (res.ok) {
            showToast(res.mensaje ?? 'Inmobiliaria actualizada');
            setEditandoOrg(false);
            router.refresh();
        } else {
            showToast(res.mensaje, 'error');
        }
    };

    if (!esAdmin) {
        return (
            <div>
                <PageHeader title="Tu sucursal" description={inmobiliaria.nombre} />
                {sucursales.length === 0 ? (
                    <div className="panel !rounded-[14px]">
                        <EstadoPantalla variante="vacio" icono={<IconMapPin className="h-7 w-7" duotone={false} />} titulo="No estás asignado a una sucursal" descripcion="Pedile a un administrador que te asigne." />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {sucursales.map((s) => (
                            <section key={s.id} className="panel !rounded-[14px] shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:!border dark:!border-[#232C45] dark:!bg-uk-card-dark dark:shadow-none">
                                <div className="mb-5 flex flex-wrap items-center gap-3">
                                    <h2 className="text-xl font-extrabold text-uk-ink dark:text-uk-ink-dark">{s.nombre}</h2>
                                    <EstadoChip label={s.activo ? 'Activa' : 'Inactiva'} color={s.activo ? 'success' : 'danger'} />
                                </div>
                                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <dt className="mb-1 text-xs font-bold text-uk-muted dark:text-uk-muted-dark">Dirección</dt>
                                        <dd className="text-sm text-uk-ink dark:text-uk-ink-dark">{s.direccion || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="mb-1 text-xs font-bold text-uk-muted dark:text-uk-muted-dark">Teléfono</dt>
                                        <dd className="text-sm tabular-nums text-uk-ink dark:text-uk-ink-dark">
                                            {s.telefono ? (
                                                <a href={enlaceTel(s.telefono)} className="hover:underline">
                                                    {formatearTelefono(s.telefono)}
                                                </a>
                                            ) : (
                                                '—'
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const nueva = (
        <Link href="/sucursales/nuevo" className="btn btn-primary h-[42px] gap-2 rounded-[10px]">
            <IconPlus />
            Nueva sucursal
        </Link>
    );

    return (
        <div>
            <PageHeader title="Sucursales" description={contar(sucursales.length, 'sucursal', 'sucursales')} actions={nueva} />

            <div className="panel !rounded-[14px] !p-0 shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:!border dark:!border-[#232C45] dark:!bg-uk-card-dark dark:shadow-none">
                <div className="flex flex-wrap items-center gap-3 border-b border-uk-line px-5 py-4 dark:border-[#232C45]">
                    {editandoOrg ? (
                        <form onSubmit={guardarOrg} className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                            <input value={nombreOrg} onChange={(e) => setNombreOrg(e.target.value)} type="text" className="form-input" placeholder="Nombre" aria-label="Nombre de la inmobiliaria" />
                            <input value={cuitOrg} onChange={(e) => setCuitOrg(e.target.value)} type="text" className="form-input" placeholder="CUIT" aria-label="CUIT" />
                            <button type="submit" className="btn btn-primary" disabled={guardando}>
                                {guardando ? 'Guardando…' : 'Guardar'}
                            </button>
                            <button type="button" className="btn btn-cancel" onClick={() => setEditandoOrg(false)}>
                                Cancelar
                            </button>
                        </form>
                    ) : (
                        <>
                            <span className="text-sm font-extrabold text-uk-ink dark:text-uk-ink-dark">{inmobiliaria.nombre}</span>
                            <button type="button" className="text-xs font-extrabold text-primary underline hover:no-underline dark:text-uk-link-dark" onClick={() => setEditandoOrg(true)}>
                                Editar inmobiliaria
                            </button>
                        </>
                    )}
                </div>

                {sucursales.length === 0 ? (
                    <div className="px-5 py-5">
                        <EstadoPantalla variante="vacio" icono={<IconMapPin className="h-7 w-7" duotone={false} />} titulo="Todavía no hay sucursales" descripcion="Creá la primera para después asignar usuarios." acciones={nueva} />
                    </div>
                ) : (
                    <div className="datatables tabla-lista">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={sucursales}
                            minHeight={0}
                            highlightOnHover
                            rowClassName="cursor-pointer"
                            onRowClick={(s: Sucursal) => router.push(`/sucursales/${s.id}`)}
                            columns={[
                                {
                                    accessor: 'nombre',
                                    title: 'Nombre',
                                    render: (s: Sucursal) => (
                                        <Link href={`/sucursales/${s.id}`} className="font-bold text-primary no-underline hover:underline dark:text-uk-link-dark" onClick={(e) => e.stopPropagation()}>
                                            {s.nombre}
                                        </Link>
                                    ),
                                },
                                { accessor: 'direccion', title: 'Dirección', render: (s: Sucursal) => s.direccion || '—' },
                                {
                                    accessor: 'telefono',
                                    title: 'Teléfono',
                                    render: (s: Sucursal) =>
                                        s.telefono ? (
                                            <a href={enlaceTel(s.telefono)} className="tabular-nums hover:underline" onClick={(e) => e.stopPropagation()}>
                                                {formatearTelefono(s.telefono)}
                                            </a>
                                        ) : (
                                            '—'
                                        ),
                                },
                                { accessor: 'activo', title: 'Estado', render: (s: Sucursal) => <EstadoChip label={s.activo ? 'Activa' : 'Inactiva'} color={s.activo ? 'success' : 'danger'} /> },
                                {
                                    accessor: 'action',
                                    title: <span className="sr-only">Acciones</span>,
                                    textAlignment: 'right',
                                    render: (s: Sucursal) => (
                                        <div className="flex justify-end">
                                            <MenuFilaTabla
                                                ariaLabel={`Más acciones para ${s.nombre}`}
                                                items={[
                                                    { etiqueta: 'Ver detalle', href: `/sucursales/${s.id}` },
                                                    { etiqueta: 'Editar', href: `/sucursales/${s.id}/editar` },
                                                ]}
                                            />
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SucursalesList;
