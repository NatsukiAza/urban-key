'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '@/store/themeConfigSlice';
import IconEdit from '@/components/Icon/IconEdit';
import { cambiarEtapa } from '@/lib/oportunidad/actions';
import { showToast } from '@/lib/ui/toast';
import { estadoOportunidadConfig } from '@/lib/enums/estadoOportunidad';
import { formatearImporte } from '@/lib/enums/moneda';
import type { OportunidadDetalle as TDetalle } from '@/lib/oportunidad/types';
import type { Etapa, MotivoPerdida } from '@/lib/dominio';
import DetailHero from '@/components/ui/DetailHero';
import Timeline from '@/components/ui/Timeline';

interface Props {
    detalle: TDetalle;
    etapasFunnel: Etapa[];
    motivosPerdida: MotivoPerdida[];
}

const fmtFecha = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-AR') : '—');

const OportunidadDetalle = ({ detalle, etapasFunnel, motivosPerdida }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Detalle de oportunidad'));
    });

    const [nuevaEtapaId, setNuevaEtapaId] = useState(detalle.etapaId);
    const cerrada = detalle.estado !== 'ABIERTA';

    const showMessage = (msg = '', type: any = 'success') => showToast(msg, type);

    const onCambiarEtapa = async () => {
        if (nuevaEtapaId === detalle.etapaId) {
            showMessage('La oportunidad ya está en esa etapa', 'info');
            return;
        }
        const etapa = etapasFunnel.find((e) => e.id === nuevaEtapaId);
        let motivoPerdidaId: string | null = null;
        if (etapa?.resultado === 'PERDIDA') {
            const opciones = motivosPerdida.reduce((acc: Record<string, string>, m) => ({ ...acc, [m.id]: m.nombre }), {});
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
        const res = await cambiarEtapa({ oportunidadId: detalle.id, etapaId: nuevaEtapaId, motivoPerdidaId });
        if (res.ok) {
            showMessage(res.mensaje);
            router.refresh();
        } else {
            showMessage(res.mensaje, 'error');
            setNuevaEtapaId(detalle.etapaId);
        }
    };

    const Campo = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div>
            <div className="text-white-dark text-xs uppercase">{label}</div>
            <div className="font-semibold">{children}</div>
        </div>
    );

    const responsable = detalle.responsable ? `${detalle.responsable.nombre} ${detalle.responsable.apellido}` : '—';

    return (
        <div className="space-y-5">
            <DetailHero
                title={detalle.titulo}
                badges={<span className={`badge badge-outline-${estadoOportunidadConfig[detalle.estado].color}`}>{estadoOportunidadConfig[detalle.estado].label}</span>}
                actions={
                    <>
                        {!cerrada && (
                            <Link href={`/oportunidades/${detalle.id}/editar`} className="btn btn-primary gap-2">
                                <IconEdit className="w-4.5 h-4.5" />
                                Editar
                            </Link>
                        )}
                        <Link href="/oportunidades" className="btn btn-outline-primary">
                            Volver
                        </Link>
                    </>
                }
                facts={[
                    { label: 'Valor estimado', value: formatearImporte(detalle.valorEstimado, detalle.moneda), emphasis: true },
                    { label: 'Etapa actual', value: detalle.etapa?.nombre ?? '—' },
                    { label: 'Responsable', value: responsable },
                ]}
            />

            <div className="panel">
                <h2 className="mb-4 text-lg font-semibold">Datos</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <Campo label="Interesado / Contacto">{detalle.contacto ? `${detalle.contacto.nombre} ${detalle.contacto.apellido}` : '—'}</Campo>
                    <Campo label="Inmueble">{detalle.inmueble ? detalle.inmueble.direccion : '—'}</Campo>
                    <Campo label="Funnel">{detalle.funnel?.nombre ?? '—'}</Campo>
                    <Campo label="Origen">{detalle.origen?.nombre ?? '—'}</Campo>
                    <Campo label="Fecha de cierre">{fmtFecha(detalle.fechaCierreReal)}</Campo>
                    {detalle.motivoPerdida && <Campo label="Motivo de pérdida">{detalle.motivoPerdida.nombre}</Campo>}
                    <div className="sm:col-span-2 lg:col-span-3">
                        <Campo label="Observaciones">{detalle.observaciones || '—'}</Campo>
                    </div>
                </div>
            </div>

            {!cerrada && (
                <div className="panel">
                    <h3 className="text-lg font-semibold mb-3">Cambiar etapa</h3>
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label htmlFor="nuevaEtapa">Nueva etapa</label>
                            <select id="nuevaEtapa" value={nuevaEtapaId} onChange={(e) => setNuevaEtapaId(e.target.value)} className="form-select w-64">
                                {etapasFunnel.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button type="button" className="btn btn-primary" onClick={onCambiarEtapa}>
                            Aplicar
                        </button>
                    </div>
                </div>
            )}

            <div className="panel">
                <h2 className="mb-4 text-lg font-semibold">Historial de etapas</h2>
                <Timeline
                    vacio="Sin cambios de etapa registrados."
                    items={detalle.historial.map((h) => ({
                        id: h.id,
                        title: `${h.etapaAnterior?.nombre ?? 'Inicio'} → ${h.etapaNueva?.nombre ?? '—'}`,
                        meta: `${fmtFecha(h.creadoEn)} · ${h.usuario ? `${h.usuario.nombre} ${h.usuario.apellido}` : '—'}${h.observacion ? ` · ${h.observacion}` : ''}`,
                    }))}
                />
            </div>
        </div>
    );
};

export default OportunidadDetalle;
