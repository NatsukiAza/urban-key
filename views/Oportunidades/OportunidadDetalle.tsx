'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '@/store/themeConfigSlice';
import IconEdit from '@/components/Icon/IconEdit';
import { cambiarEtapa, reasignarResponsable } from '@/lib/oportunidad/actions';
import { showToast } from '@/lib/ui/toast';
import { estadoOportunidadConfig } from '@/lib/enums/estadoOportunidad';
import { formatearImporte } from '@/lib/enums/moneda';
import type { OportunidadDetalle as TDetalle } from '@/lib/oportunidad/types';
import type { Etapa, MotivoPerdida, Usuario } from '@/lib/dominio';
import DetailHero from '@/components/ui/DetailHero';
import Timeline from '@/components/ui/Timeline';
import { pedirDatosCierre } from './pedirDatosCierre';
import EstadoChip from '@/components/ui/EstadoChip';
import { useBreadcrumbDetalle } from '@/components/Layouts/useBreadcrumbDetalle';

interface Props {
    detalle: TDetalle;
    etapasFunnel: Etapa[];
    motivosPerdida: MotivoPerdida[];
    usuarios: Usuario[];
    puedeReasignar: boolean;
}

const fmtFecha = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-AR') : '—');
const fmtDia = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-AR') : '—');

const OportunidadDetalle = ({ detalle, etapasFunnel, motivosPerdida, usuarios, puedeReasignar }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useBreadcrumbDetalle(detalle.titulo, detalle.funnel?.nombre);
    useEffect(() => {
        dispatch(setPageTitle('Detalle de oportunidad'));
    });

    const [nuevaEtapaId, setNuevaEtapaId] = useState(detalle.etapaId);
    const cerrada = detalle.estado !== 'ABIERTA';

    const showMessage = (msg = '', type: any = 'success') => showToast(msg, type);

    const moverA = async (etapa: Etapa | undefined) => {
        if (!etapa) return;
        if (etapa.id === detalle.etapaId) {
            showMessage('La oportunidad ya está en esa etapa', 'info');
            return;
        }
        const cierre = await pedirDatosCierre({
            resultado: etapa.resultado,
            etapaNombre: etapa.nombre,
            motivosPerdida,
            valorEstimado: detalle.valorEstimado,
            moneda: detalle.moneda,
            titulo: detalle.titulo,
            contacto: detalle.contacto ? `${detalle.contacto.nombre} ${detalle.contacto.apellido}` : undefined,
        });
        if (!cierre) return;
        const res = await cambiarEtapa({ oportunidadId: detalle.id, etapaId: etapa.id, ...cierre });
        if (res.ok) {
            showMessage(res.mensaje);
            router.refresh();
        } else {
            showMessage(res.mensaje, 'error');
            setNuevaEtapaId(detalle.etapaId);
        }
    };

    const etapaGanada = etapasFunnel.find((e) => e.resultado === 'GANADA');
    const etapaPerdida = etapasFunnel.find((e) => e.resultado === 'PERDIDA');

    const onReasignar = async () => {
        const opciones = usuarios
            .filter((u) => u.id !== detalle.responsableId)
            .reduce((acc: Record<string, string>, u) => ({ ...acc, [u.id]: `${u.nombre} ${u.apellido}` }), {});
        const { value, isConfirmed } = await Swal.fire({
            title: 'Reasignar responsable',
            input: 'select',
            inputOptions: opciones,
            inputPlaceholder: 'Seleccionar responsable',
            showCancelButton: true,
            confirmButtonText: 'Reasignar',
            cancelButtonText: 'Cancelar',
            padding: '2em',
            inputValidator: (v) => (!v ? 'Tenés que elegir un responsable' : undefined),
        });
        if (!isConfirmed) return;
        const res = await reasignarResponsable({ oportunidadId: detalle.id, responsableId: value });
        showMessage(res.mensaje, res.ok ? 'success' : 'error');
        if (res.ok) router.refresh();
    };

    const Campo = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div>
            <div className="text-uk-muted dark:text-uk-muted-dark text-xs uppercase">{label}</div>
            <div className="font-semibold">{children}</div>
        </div>
    );

    const responsable = detalle.responsable ? `${detalle.responsable.nombre} ${detalle.responsable.apellido}` : '—';
    const ganadaConValor = detalle.estado === 'GANADA' && detalle.valorFinal != null;

    return (
        <div className="space-y-5">
            <DetailHero
                title={detalle.titulo}
                badges={<EstadoChip label={estadoOportunidadConfig[detalle.estado].label} color={estadoOportunidadConfig[detalle.estado].color} />}
                actions={
                    <>
                        {!cerrada && (
                            <>
                                <Link href={`/oportunidades/${detalle.id}/editar`} className="btn btn-primary gap-2">
                                    <IconEdit className="w-4.5 h-4.5" />
                                    Editar
                                </Link>
                                {puedeReasignar && (
                                    <button type="button" className="btn btn-outline-primary" onClick={onReasignar}>
                                        Reasignar
                                    </button>
                                )}
                                {etapaGanada && (
                                    <button type="button" className="btn btn-success" onClick={() => moverA(etapaGanada)}>
                                        Marcar ganada
                                    </button>
                                )}
                                {etapaPerdida && (
                                    <button type="button" className="btn btn-outline-danger" onClick={() => moverA(etapaPerdida)}>
                                        Marcar perdida
                                    </button>
                                )}
                            </>
                        )}
                    </>
                }
                facts={[
                    ganadaConValor
                        ? { label: 'Valor final', value: formatearImporte(detalle.valorFinal, detalle.moneda), emphasis: true }
                        : { label: 'Valor estimado', value: formatearImporte(detalle.valorEstimado, detalle.moneda), emphasis: true },
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
                    <Campo label="Cierre estimado">{detalle.fechaCierreEstimada ? new Date(`${detalle.fechaCierreEstimada}T12:00:00`).toLocaleDateString('es-AR') : '—'}</Campo>
                    <Campo label="Fecha de cierre">{fmtDia(detalle.fechaCierreReal)}</Campo>
                    {ganadaConValor && <Campo label="Valor estimado">{formatearImporte(detalle.valorEstimado, detalle.moneda)}</Campo>}
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
                        <button type="button" className="btn btn-primary" onClick={() => moverA(etapasFunnel.find((e) => e.id === nuevaEtapaId))}>
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
