'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import IconPlus from '@/components/Icon/IconPlus';
import IconEye from '@/components/Icon/IconEye';
import IconEdit from '@/components/Icon/IconEdit';
import { actualizarInmobiliaria, crearInmobiliaria } from '@/lib/sucursal/actions';
import { showToast } from '@/lib/ui/toast';
import type { Inmobiliaria, Sucursal } from '@/lib/sucursal/types';

interface Props {
    inmobiliaria: Inmobiliaria | null;
    sucursales: Sucursal[];
    esAdmin: boolean;
}

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
        dispatch(setPageTitle('Sucursales'));
    });

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
                        <p className="text-white-dark mb-5">Cargá la inmobiliaria una sola vez. Después vas a poder crear sus sucursales y asignar usuarios.</p>
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
                    <p className="text-white-dark">Todavía no hay una inmobiliaria cargada. Pedile a un administrador que la dé de alta.</p>
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

    return (
        <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
            <div className="mb-5 px-5 flex md:items-center md:flex-row flex-col gap-4">
                <div className="flex-1">
                    {editandoOrg ? (
                        <form onSubmit={guardarOrg} className="flex flex-col sm:flex-row gap-3">
                            <input value={nombreOrg} onChange={(e) => setNombreOrg(e.target.value)} type="text" className="form-input" placeholder="Nombre" aria-label="Nombre de la inmobiliaria" />
                            <input value={cuitOrg} onChange={(e) => setCuitOrg(e.target.value)} type="text" className="form-input" placeholder="CUIT" aria-label="CUIT" />
                            <button type="submit" className="btn btn-primary" disabled={guardando}>
                                {guardando ? 'Guardando…' : 'Guardar'}
                            </button>
                            <button type="button" className="btn btn-outline-danger" onClick={() => setEditandoOrg(false)}>
                                Cancelar
                            </button>
                        </form>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-semibold">{inmobiliaria.nombre}</h2>
                                {esAdmin && (
                                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setEditandoOrg(true)}>
                                        Editar
                                    </button>
                                )}
                            </div>
                            <p className="text-white-dark text-sm">{esAdmin ? 'Todas las sucursales de la inmobiliaria.' : 'Tu sucursal asignada.'}</p>
                        </>
                    )}
                </div>
                {esAdmin && (
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <Link href="/sucursales/nuevo" className="btn btn-primary gap-2">
                            <IconPlus />
                            Nueva sucursal
                        </Link>
                    </div>
                )}
            </div>

            {sucursales.length === 0 ? (
                <div className="px-5 pb-5 text-white-dark">{esAdmin ? 'Todavía no hay sucursales. Creá la primera para después asignar usuarios.' : 'No estás asignado a una sucursal. Pedile a un administrador que te asigne.'}</div>
            ) : (
                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Dirección</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sucursales.map((s) => (
                                <tr key={s.id}>
                                    <td className="font-semibold">{s.nombre}</td>
                                    <td>{s.direccion || '—'}</td>
                                    <td>{s.telefono || '—'}</td>
                                    <td>
                                        <span className={`badge ${s.activo ? 'badge-outline-success' : 'badge-outline-danger'}`}>{s.activo ? 'Activa' : 'Inactiva'}</span>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link href={`/sucursales/${s.id}`} className="hover:text-primary" title="Ver">
                                                <IconEye />
                                            </Link>
                                            {esAdmin && (
                                                <Link href={`/sucursales/${s.id}/editar`} className="hover:text-primary" title="Editar">
                                                    <IconEdit />
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SucursalesList;
