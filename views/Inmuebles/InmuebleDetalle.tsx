'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '@/store/themeConfigSlice';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrashLines from '@/components/Icon/IconTrashLines';
import { darDeBajaInmueble } from '@/lib/inmueble/actions';
import { showToast } from '@/lib/ui/toast';
import { tipoOperacionConfig } from '@/lib/enums/tipoOperacion';
import { tipoInmuebleConfig } from '@/lib/enums/tipoInmueble';
import { estadoInmuebleConfig } from '@/lib/enums/estadoInmueble';
import { estadoOportunidadConfig } from '@/lib/enums/estadoOportunidad';
import { formatearImporte } from '@/lib/enums/moneda';
import type { InmuebleDetalle as TDetalle } from '@/lib/inmueble/types';

interface Props {
    detalle: TDetalle;
}

const fmtFecha = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-AR') : '—');
const fmtNumero = (v: number | null, sufijo = '') => (v != null ? `${v.toLocaleString('es-AR')}${sufijo}` : '—');

const Campo = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <div className="text-white-dark text-xs uppercase">{label}</div>
        <div className="font-semibold">{children}</div>
    </div>
);

const InmuebleDetalle = ({ detalle }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Detalle de inmueble'));
    });

    const showMessage = (msg = '', type: any = 'success') => showToast(msg, type);

    const abiertas = detalle.oportunidades.filter((o) => o.estado === 'ABIERTA').length;

    const darDeBaja = async () => {
        const result = await Swal.fire({
            title: '¿Dar de baja el inmueble?',
            text: 'Se conserva el historial (baja lógica).',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Dar de baja',
            cancelButtonText: 'Cancelar',
            padding: '2em',
        });
        if (!result.isConfirmed) return;
        const res = await darDeBajaInmueble(detalle.id);
        if (res.ok) {
            showMessage(res.mensaje);
            router.push('/inmuebles');
            router.refresh();
        } else {
            showMessage(res.mensaje, 'error');
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-semibold">{detalle.direccion}</h2>
                    <span className={`badge badge-outline-${estadoInmuebleConfig[detalle.estado].color}`}>{estadoInmuebleConfig[detalle.estado].label}</span>
                    <span className={`badge badge-outline-${tipoOperacionConfig[detalle.tipoOperacion].color}`}>{tipoOperacionConfig[detalle.tipoOperacion].label}</span>
                    <span className={`badge badge-outline-${tipoInmuebleConfig[detalle.tipoInmueble].color}`}>{tipoInmuebleConfig[detalle.tipoInmueble].label}</span>
                </div>
                <div className="flex gap-2">
                    <Link href={`/inmuebles/${detalle.id}/editar`} className="btn btn-primary gap-2">
                        <IconEdit className="w-4.5 h-4.5" />
                        Editar
                    </Link>
                    <button type="button" className="btn btn-outline-danger gap-2" onClick={darDeBaja} disabled={abiertas > 0} title={abiertas > 0 ? 'Tiene oportunidades abiertas' : undefined}>
                        <IconTrashLines className="w-4.5 h-4.5" />
                        Dar de baja
                    </button>
                    <Link href="/inmuebles" className="btn btn-outline-primary">
                        Volver
                    </Link>
                </div>
            </div>

            <div className="panel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Campo label="Propietario">
                    {detalle.propietario ? (
                        <>
                            {detalle.propietario.nombre} {detalle.propietario.apellido}
                            {detalle.propietario.telefono && <div className="text-white-dark text-xs font-normal">{detalle.propietario.telefono}</div>}
                        </>
                    ) : (
                        '—'
                    )}
                </Campo>
                <Campo label="Localidad">{detalle.localidad || '—'}</Campo>
                <Campo label="Nombre interno">{detalle.nombre || '—'}</Campo>
                <Campo label="Precio">{formatearImporte(detalle.precio, detalle.moneda)}</Campo>

                <Campo label="Ambientes">{fmtNumero(detalle.ambientes)}</Campo>
                <Campo label="Dormitorios">{fmtNumero(detalle.dormitorios)}</Campo>
                <Campo label="Baños">{fmtNumero(detalle.banos)}</Campo>
                <Campo label="Superficie">{fmtNumero(detalle.m2, ' m²')}</Campo>

                <Campo label="Cochera">{detalle.cochera ? 'Sí' : 'No'}</Campo>
                <Campo label="Antigüedad">{detalle.antiguedad != null ? (detalle.antiguedad === 0 ? 'A estrenar' : `${detalle.antiguedad} años`) : '—'}</Campo>
                <Campo label="Expensas">{formatearImporte(detalle.expensas, detalle.moneda)}</Campo>
                <Campo label="Alta">{fmtFecha(detalle.creadoEn)}</Campo>

                <div className="sm:col-span-2 lg:col-span-4">
                    <Campo label="Descripción">
                        <span className="font-normal whitespace-pre-line">{detalle.descripcion || '—'}</span>
                    </Campo>
                </div>
            </div>

            <div className="panel">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h3 className="text-lg font-semibold">Oportunidades del inmueble</h3>
                    {abiertas > 0 && <span className="badge badge-outline-info">{abiertas} abierta{abiertas === 1 ? '' : 's'}</span>}
                </div>
                {detalle.oportunidades.length === 0 ? (
                    <p className="text-white-dark">Este inmueble todavía no tiene oportunidades asociadas.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Contacto</th>
                                    <th>Responsable</th>
                                    <th>Funnel</th>
                                    <th>Etapa</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detalle.oportunidades.map((o) => (
                                    <tr key={o.id}>
                                        <td>
                                            <Link href={`/oportunidades/${o.id}`} className="text-primary underline hover:no-underline font-semibold">
                                                {o.titulo}
                                            </Link>
                                        </td>
                                        <td>{o.contacto || '—'}</td>
                                        <td>{o.responsable || '—'}</td>
                                        <td>{o.funnel || '—'}</td>
                                        <td>{o.etapa || '—'}</td>
                                        <td>
                                            <span className={`badge badge-outline-${estadoOportunidadConfig[o.estado].color}`}>{estadoOportunidadConfig[o.estado].label}</span>
                                        </td>
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

export default InmuebleDetalle;
