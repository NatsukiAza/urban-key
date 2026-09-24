'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '@/store/themeConfigSlice';
import IconEdit from '@/components/Icon/IconEdit';
import { asignarUsuarioASucursal, quitarUsuarioDeSucursal } from '@/lib/sucursal/actions';
import { showToast } from '@/lib/ui/toast';
import { rolUsuarioConfig } from '@/lib/enums/rolUsuario';
import type { SucursalDetalle, UsuarioDeSucursal } from '@/lib/sucursal/types';

interface Props {
    detalle: SucursalDetalle;
    esAdmin: boolean;
    candidatos: UsuarioDeSucursal[];
}

const Campo = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <div className="text-white-dark text-xs uppercase">{label}</div>
        <div className="font-semibold">{children}</div>
    </div>
);

const SucursalDetalleView = ({ detalle, esAdmin, candidatos }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [usuarioId, setUsuarioId] = useState('');
    const [asignando, setAsignando] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(detalle.nombre));
    });

    const disponibles = candidatos.filter((u) => u.sucursalId !== detalle.id);

    const asignar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuarioId) return;
        const elegido = disponibles.find((u) => u.id === usuarioId);
        if (elegido?.sucursalNombre) {
            const confirm = await Swal.fire({
                title: '¿Mover al usuario?',
                text: `${elegido.nombre} ${elegido.apellido} hoy está en ${elegido.sucursalNombre}. Va a pasar a ${detalle.nombre}.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Mover',
                cancelButtonText: 'Cancelar',
                padding: '2em',
            });
            if (!confirm.isConfirmed) return;
        }
        setAsignando(true);
        const res = await asignarUsuarioASucursal(detalle.id, usuarioId);
        setAsignando(false);
        if (res.ok) {
            showToast(res.mensaje ?? 'Usuario asignado');
            setUsuarioId('');
            router.refresh();
        } else {
            showToast(res.mensaje, 'error');
        }
    };

    const quitar = async (usuario: UsuarioDeSucursal) => {
        const confirm = await Swal.fire({
            title: '¿Quitar de la sucursal?',
            text: `${usuario.nombre} ${usuario.apellido} deja de pertenecer a ${detalle.nombre}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Quitar',
            cancelButtonText: 'Cancelar',
            padding: '2em',
        });
        if (!confirm.isConfirmed) return;
        const res = await quitarUsuarioDeSucursal(detalle.id, usuario.id);
        if (res.ok) {
            showToast(res.mensaje ?? 'Usuario quitado');
            router.refresh();
        } else {
            showToast(res.mensaje, 'error');
        }
    };

    return (
        <div className="space-y-5">
            <div className="panel">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                    <div>
                        <h2 className="text-xl font-semibold">{detalle.nombre}</h2>
                        <span className={`badge mt-2 ${detalle.activo ? 'badge-outline-success' : 'badge-outline-danger'}`}>{detalle.activo ? 'Activa' : 'Inactiva'}</span>
                    </div>
                    {esAdmin && (
                        <Link href={`/sucursales/${detalle.id}/editar`} className="btn btn-primary gap-2">
                            <IconEdit />
                            Editar
                        </Link>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Campo label="Dirección">{detalle.direccion || '—'}</Campo>
                    <Campo label="Teléfono">{detalle.telefono || '—'}</Campo>
                </div>
            </div>

            <div className="panel">
                <h3 className="text-lg font-semibold mb-4">Usuarios de la sucursal</h3>
                {esAdmin && (
                    <form onSubmit={asignar} className="flex flex-col sm:flex-row gap-3 mb-5">
                        <select className="form-select flex-1" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} disabled={!detalle.activo || disponibles.length === 0}>
                            <option value="">{detalle.activo ? 'Agregar un usuario…' : 'La sucursal está inactiva'}</option>
                            {disponibles.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.apellido}, {u.nombre} ({u.email}){u.sucursalNombre ? ` — hoy en ${u.sucursalNombre}` : ''}
                                </option>
                            ))}
                        </select>
                        <button type="submit" className="btn btn-primary" disabled={asignando || !usuarioId || !detalle.activo}>
                            {asignando ? 'Asignando…' : 'Agregar'}
                        </button>
                    </form>
                )}

                {detalle.usuarios.length === 0 ? (
                    <p className="text-white-dark">Esta sucursal todavía no tiene usuarios.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    {esAdmin && <th className="text-center">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {detalle.usuarios.map((u) => (
                                    <tr key={u.id}>
                                        <td className="font-semibold">
                                            {u.apellido}, {u.nombre}
                                        </td>
                                        <td>{u.email}</td>
                                        <td>{rolUsuarioConfig[u.rol].label}</td>
                                        <td>
                                            <span className={`badge ${u.activo ? 'badge-outline-success' : 'badge-outline-danger'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span>
                                        </td>
                                        {esAdmin && (
                                            <td className="text-center">
                                                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => quitar(u)}>
                                                    Quitar
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SucursalDetalleView;
