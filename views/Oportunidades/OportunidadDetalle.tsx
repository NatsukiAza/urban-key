'use client';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '@/store/themeConfigSlice';
import IconEdit from '@/components/Icon/IconEdit';
import IconPhone from '@/components/Icon/IconPhone';
import IconMail from '@/components/Icon/IconMail';
import { cambiarEtapa, reasignarResponsable } from '@/lib/oportunidad/actions';
import { showToast, toastMovimiento, toastErrorMovimiento } from '@/lib/ui/toast';
import { modalMoverEtapa } from '@/lib/ui/modales';
import { estadoOportunidadConfig } from '@/lib/enums/estadoOportunidad';
import { formatearMonto } from '@/lib/enums/moneda';
import { tipoOperacionConfig } from '@/lib/enums/tipoOperacion';
import { tipoInmuebleConfig } from '@/lib/enums/tipoInmueble';
import { diasHasta, diasRelativos, formatearFecha, formatearFechaHora } from '@/lib/formato';
import type { OportunidadDetalle as TDetalle } from '@/lib/oportunidad/types';
import type { Etapa, MotivoPerdida, Usuario } from '@/lib/dominio';
import Timeline from '@/components/ui/Timeline';
import EstadoChip from '@/components/ui/EstadoChip';
import { inicialesDe } from '@/components/ui/Iniciales';
import BarraEtapas from '@/components/oportunidad/BarraEtapas';
import { useBreadcrumbDetalle } from '@/components/Layouts/useBreadcrumbDetalle';
import { pedirDatosCierre } from './pedirDatosCierre';

interface Props {
    detalle: TDetalle;
    etapasFunnel: Etapa[];
    motivosPerdida: MotivoPerdida[];
    usuarios: Usuario[];
    puedeReasignar: boolean;
}

const claseBotonBase = 'btn h-10 rounded-[10px] shadow-none';

const Flecha = () => (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mx-2.5 inline-block align-[-2px]">
        <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
);

const Dato = ({ etiqueta, children, className = '' }: { etiqueta: string; children: ReactNode; className?: string }) => (
    <div className={className}>
        <dt className="text-xs font-bold text-uk-muted dark:text-uk-muted-dark">{etiqueta}</dt>
        <dd className="mt-1 text-sm font-bold text-uk-ink dark:text-uk-ink-dark">{children}</dd>
    </div>
);

const OportunidadDetalle = ({ detalle, etapasFunnel, motivosPerdida, usuarios, puedeReasignar }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useBreadcrumbDetalle(detalle.titulo, detalle.funnel?.nombre);
    useEffect(() => {
        dispatch(setPageTitle('Detalle de oportunidad'));
    });

    const cerrada = detalle.estado !== 'ABIERTA';
    const etapasAbiertas = etapasFunnel.filter((e) => e.resultado === 'ABIERTA');
    const etapaActual = etapasFunnel.find((e) => e.id === detalle.etapaId);
    const indiceActual = etapasAbiertas.findIndex((e) => e.id === detalle.etapaId);
    const siguiente = !cerrada && indiceActual >= 0 ? etapasAbiertas[indiceActual + 1] : undefined;
    const etapaGanada = etapasFunnel.find((e) => e.resultado === 'GANADA');
    const etapaPerdida = etapasFunnel.find((e) => e.resultado === 'PERDIDA');

    // Última etapa abierta que recorrió antes de cerrarse (el historial viene del más nuevo al más viejo).
    const ultimaAbierta = cerrada ? detalle.historial.find((h) => h.etapaNueva?.resultado !== 'ABIERTA')?.etapaAnteriorId ?? '' : detalle.etapaId;

    const contactoNombre = detalle.contacto ? `${detalle.contacto.nombre} ${detalle.contacto.apellido}` : undefined;
    const responsable = detalle.responsable ? `${detalle.responsable.nombre} ${detalle.responsable.apellido}` : '—';
    const creador = detalle.creador ? `${detalle.creador.nombre} ${detalle.creador.apellido}` : null;
    const diasEnEtapa = Math.max(0, -diasHasta(detalle.enEtapaDesde));

    const moverAEtapaAbierta = async (etapa: Etapa | undefined) => {
        if (!etapa || !etapaActual || etapa.id === detalle.etapaId) return;
        const confirmacion = await modalMoverEtapa({ titulo: detalle.titulo, etapaOrigen: etapaActual.nombre, etapaDestino: etapa.nombre });
        if (!confirmacion) return;

        const res = await cambiarEtapa({ oportunidadId: detalle.id, etapaId: etapa.id, observacion: confirmacion.observacion });
        if (!res.ok) {
            void toastErrorMovimiento(etapaActual.nombre).then(async (reintentar) => {
                if (!reintentar) return;
                const nuevo = await cambiarEtapa({ oportunidadId: detalle.id, etapaId: etapa.id, observacion: confirmacion.observacion });
                if (!nuevo.ok) void toastErrorMovimiento(etapaActual.nombre);
                router.refresh();
            });
            return;
        }
        router.refresh();
        void toastMovimiento(detalle.titulo, etapa.nombre).then(async (deshacer) => {
            if (!deshacer) return;
            const revertido = await cambiarEtapa({ oportunidadId: detalle.id, etapaId: etapaActual.id, observacion: 'Movimiento deshecho' });
            if (!revertido.ok) void toastErrorMovimiento(etapa.nombre);
            router.refresh();
        });
    };

    const cerrar = async (etapa: Etapa | undefined) => {
        if (!etapa) return;
        const cierre = await pedirDatosCierre({
            resultado: etapa.resultado,
            etapaNombre: etapa.nombre,
            motivosPerdida,
            valorEstimado: detalle.valorEstimado,
            moneda: detalle.moneda,
            titulo: detalle.titulo,
            contacto: contactoNombre,
        });
        if (!cierre) return;
        const res = await cambiarEtapa({ oportunidadId: detalle.id, etapaId: etapa.id, ...cierre });
        showToast(res.mensaje ?? '', res.ok ? 'success' : 'error');
        if (res.ok) router.refresh();
    };

    const onSeleccionarEtapa = (etapaId: string) => moverAEtapaAbierta(etapasAbiertas.find((e) => e.id === etapaId));

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
        showToast(res.mensaje ?? '', res.ok ? 'success' : 'error');
        if (res.ok) router.refresh();
    };

    const valorMostrado = detalle.estado === 'GANADA' && detalle.valorFinal != null ? { etiqueta: 'Valor final', valor: detalle.valorFinal } : { etiqueta: 'Valor estimado', valor: detalle.valorEstimado };
    const diasCierre = detalle.fechaCierreEstimada ? diasHasta(detalle.fechaCierreEstimada) : null;
    const vencida = !cerrada && diasCierre !== null && diasCierre < 0;

    const metaPartes = [
        detalle.funnel?.nombre,
        detalle.origen ? `Origen: ${detalle.origen.nombre}` : null,
        `Creada el ${formatearFecha(detalle.creadoEn)}${creador ? ` por ${creador}` : ''}`,
    ].filter(Boolean);

    const itemsHistorial = detalle.historial.map((h) => {
        const creacion = h.etapaAnterior === null;
        return {
            id: h.id,
            title: creacion ? (
                <>
                    Creada en <strong>{h.etapaNueva?.nombre ?? '—'}</strong>
                </>
            ) : (
                <>
                    {h.etapaAnterior?.nombre ?? '—'}
                    <Flecha />
                    <strong>{h.etapaNueva?.nombre ?? '—'}</strong>
                </>
            ),
            meta: `${formatearFechaHora(h.creadoEn)} · ${h.usuario ? `${h.usuario.nombre} ${h.usuario.apellido}` : '—'}`,
            nota: h.observacion,
            sinNota: !creacion && !h.observacion,
            ultimo: creacion,
        };
    });

    const rolContacto = detalle.contacto ? (detalle.contacto.esPropietario ? 'Propietario' : detalle.contacto.esInteresado ? 'Interesado' : null) : null;
    const inmueble = detalle.inmueble;

    return (
        <div className="space-y-5">
            {cerrada ? (
                <div
                    role="status"
                    className={`rounded-xl border px-4 py-3 text-sm font-extrabold ${
                        detalle.estado === 'GANADA'
                            ? 'border-[#9FD9B9] bg-[#E6F6EE] text-uk-won dark:border-uk-won-dark/30 dark:bg-success/10 dark:text-uk-won-dark'
                            : 'border-[#F0B7BB] bg-[#FDECEE] text-uk-lost dark:border-uk-lost-dark/30 dark:bg-danger/10 dark:text-uk-lost-dark'
                    }`}
                >
                    {detalle.estado === 'GANADA'
                        ? `Cerrada como ganada el ${formatearFecha(detalle.fechaCierreReal)}${detalle.valorFinal != null ? ` · ${formatearMonto(detalle.valorFinal, detalle.moneda)}` : ''}`
                        : `Perdida el ${formatearFecha(detalle.fechaCierreReal)}${detalle.motivoPerdida ? ` · Motivo: ${detalle.motivoPerdida.nombre}` : ''}`}
                </div>
            ) : null}

            <section className="panel shadow-[0_2px_4px_rgba(30,15,40,.14)] flex flex-col gap-6 !rounded-[14px] !p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-uk-ink dark:text-uk-ink-dark">{detalle.titulo}</h1>
                            <EstadoChip label={estadoOportunidadConfig[detalle.estado].label} color={estadoOportunidadConfig[detalle.estado].color} />
                        </div>
                        <p className="mt-1 text-xs text-uk-muted dark:text-uk-muted-dark">{metaPartes.join(' · ')}</p>
                    </div>
                    {!cerrada ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={`/oportunidades/${detalle.id}/editar`}
                                aria-label="Editar oportunidad"
                                title="Editar oportunidad"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-uk-field text-uk-ink hover:bg-uk-col dark:border-uk-field-dark dark:text-uk-ink-dark dark:hover:bg-white/5"
                            >
                                <IconEdit className="h-4.5 w-4.5" />
                            </Link>
                            {etapaPerdida ? (
                                <button type="button" className={`${claseBotonBase} border border-[#F0B7BB] bg-white text-uk-lost hover:bg-[#FDECEE] dark:border-uk-lost-dark/40 dark:bg-transparent dark:text-uk-lost-dark dark:hover:bg-danger/10`} onClick={() => cerrar(etapaPerdida)}>
                                    Marcar perdida
                                </button>
                            ) : null}
                            {etapaGanada ? (
                                <button type="button" className={`${claseBotonBase} border border-[#9FD9B9] bg-white text-uk-won hover:bg-[#E6F6EE] dark:border-uk-won-dark/40 dark:bg-transparent dark:text-uk-won-dark dark:hover:bg-success/10`} onClick={() => cerrar(etapaGanada)}>
                                    Marcar ganada
                                </button>
                            ) : null}
                            {siguiente ? (
                                <button type="button" className={`${claseBotonBase} btn-primary`} onClick={() => moverAEtapaAbierta(siguiente)}>
                                    Avanzar a {siguiente.nombre} →
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <BarraEtapas
                    etapas={etapasAbiertas.map((e) => ({ id: e.id, nombre: e.nombre }))}
                    etapaActualId={ultimaAbierta}
                    diasEnEtapa={diasEnEtapa}
                    estado={detalle.estado}
                    deshabilitada={cerrada}
                    onSeleccionar={onSeleccionarEtapa}
                />

                <dl className="grid gap-5 border-t border-uk-line pt-5 dark:border-uk-line-dark sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
                    <div className="lg:pr-5">
                        <dt className="text-xs font-bold text-uk-muted dark:text-uk-muted-dark">{valorMostrado.etiqueta}</dt>
                        <dd className="mt-1 text-2xl font-extrabold tabular-nums text-uk-money dark:text-uk-money-dark">
                            {valorMostrado.valor != null ? formatearMonto(valorMostrado.valor, detalle.moneda) : <span className="text-sm font-normal text-uk-muted dark:text-uk-muted-dark">— Sin valor</span>}
                        </dd>
                    </div>
                    <div className="lg:border-l lg:border-uk-line lg:px-5 dark:lg:border-uk-line-dark">
                        <dt className="text-xs font-bold text-uk-muted dark:text-uk-muted-dark">Responsable</dt>
                        <dd className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-bold text-uk-ink dark:text-uk-ink-dark">
                            <span className="grid h-[26px] w-[26px] shrink-0 place-content-center rounded-full bg-primary-light text-[10px] font-extrabold text-primary dark:bg-white/10 dark:text-uk-link-dark">
                                {inicialesDe(detalle.responsable?.nombre ?? '', detalle.responsable?.apellido ?? '')}
                            </span>
                            {responsable}
                            {puedeReasignar && !cerrada ? (
                                <button type="button" className="text-xs font-extrabold text-primary underline hover:no-underline dark:text-uk-link-dark" onClick={onReasignar}>
                                    Reasignar
                                </button>
                            ) : null}
                        </dd>
                    </div>
                    <div className="lg:border-l lg:border-uk-line lg:px-5 dark:lg:border-uk-line-dark">
                        <dt className="text-xs font-bold text-uk-muted dark:text-uk-muted-dark">Cierre estimado</dt>
                        <dd className={`mt-1 text-sm font-bold tabular-nums ${vencida ? 'text-uk-lost dark:text-uk-lost-dark' : 'text-uk-ink dark:text-uk-ink-dark'}`}>
                            {detalle.fechaCierreEstimada ? (
                                <>
                                    {formatearFecha(detalle.fechaCierreEstimada)}
                                    {!cerrada && diasCierre !== null ? <span className="font-normal"> · {diasRelativos(diasCierre)}</span> : null}
                                </>
                            ) : (
                                '—'
                            )}
                        </dd>
                    </div>
                    <div className="lg:border-l lg:border-uk-line lg:pl-5 dark:lg:border-uk-line-dark">
                        <dt className="text-xs font-bold text-uk-muted dark:text-uk-muted-dark">Interesado</dt>
                        <dd className="mt-1 text-sm font-bold">
                            {detalle.contacto ? (
                                <Link href={`/contactos/${detalle.contacto.id}`} className="text-primary hover:underline dark:text-uk-link-dark">
                                    {contactoNombre}
                                </Link>
                            ) : (
                                '—'
                            )}
                        </dd>
                    </div>
                </dl>
            </section>

            <div className="flex flex-wrap items-start gap-5">
                <section className="panel shadow-[0_2px_4px_rgba(30,15,40,.14)] min-w-0 flex-[2_1_480px] !p-6">
                    <div className="mb-5 flex items-baseline justify-between gap-3">
                        <h2 className="text-lg font-extrabold text-uk-ink dark:text-uk-ink-dark">Historial de etapas</h2>
                        <span className="text-[13px] tabular-nums text-uk-muted dark:text-uk-muted-dark">
                            {itemsHistorial.length} {itemsHistorial.length === 1 ? 'movimiento' : 'movimientos'}
                        </span>
                    </div>
                    <Timeline variante="historial" vacio="Sin cambios de etapa registrados." items={itemsHistorial} />
                </section>

                <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
                    <section className="panel shadow-[0_2px_4px_rgba(30,15,40,.14)] !p-6">
                        <h2 className="mb-4 text-base font-extrabold text-uk-ink dark:text-uk-ink-dark">Contacto</h2>
                        {detalle.contacto ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-primary-light text-sm font-extrabold text-primary dark:bg-white/10 dark:text-uk-link-dark">
                                        {inicialesDe(detalle.contacto.nombre, detalle.contacto.apellido)}
                                    </span>
                                    <div className="min-w-0">
                                        <Link href={`/contactos/${detalle.contacto.id}`} className="block truncate text-sm font-extrabold text-primary hover:underline dark:text-uk-link-dark">
                                            {contactoNombre}
                                        </Link>
                                        {rolContacto ? <span className="text-xs text-uk-muted dark:text-uk-muted-dark">{rolContacto}</span> : null}
                                    </div>
                                </div>
                                {detalle.contacto.telefono ? (
                                    <a href={`tel:${detalle.contacto.telefono.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm text-uk-ink hover:underline dark:text-uk-ink-dark">
                                        <IconPhone className="h-4 w-4 shrink-0 text-uk-muted dark:text-uk-muted-dark" />
                                        {detalle.contacto.telefono}
                                    </a>
                                ) : null}
                                {detalle.contacto.email ? (
                                    <a href={`mailto:${detalle.contacto.email}`} className="flex items-center gap-2 break-all text-sm text-uk-ink hover:underline dark:text-uk-ink-dark">
                                        <IconMail className="h-4 w-4 shrink-0 text-uk-muted dark:text-uk-muted-dark" />
                                        {detalle.contacto.email}
                                    </a>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-sm text-uk-muted dark:text-uk-muted-dark">— Sin contacto</p>
                        )}
                    </section>

                    <section className="panel shadow-[0_2px_4px_rgba(30,15,40,.14)] !p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-base font-extrabold text-uk-ink dark:text-uk-ink-dark">Datos</h2>
                            {!cerrada ? (
                                <Link href={`/oportunidades/${detalle.id}/editar`} className="text-xs font-extrabold text-primary underline hover:no-underline dark:text-uk-link-dark">
                                    Editar
                                </Link>
                            ) : null}
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                            <Dato etiqueta="Inmueble" className="col-span-2">
                                {inmueble ? (
                                    <>
                                        <Link href={`/inmuebles/${inmueble.id}`} className="text-primary hover:underline dark:text-uk-link-dark">
                                            {inmueble.direccion}
                                        </Link>
                                        <span className="block text-xs font-normal text-uk-muted dark:text-uk-muted-dark">
                                            {[tipoOperacionConfig[inmueble.tipoOperacion].label, tipoInmuebleConfig[inmueble.tipoInmueble].label, inmueble.m2 != null ? `${inmueble.m2} m²` : null].filter(Boolean).join(' · ')}
                                        </span>
                                    </>
                                ) : (
                                    <span className="font-normal italic text-uk-muted dark:text-uk-muted-dark">Sin inmueble asociado</span>
                                )}
                            </Dato>
                            <Dato etiqueta="Funnel">{detalle.funnel?.nombre ?? '—'}</Dato>
                            <Dato etiqueta="Moneda">{detalle.moneda}</Dato>
                            <Dato etiqueta="Origen">{detalle.origen?.nombre ?? '—'}</Dato>
                            <Dato etiqueta="Creada">{formatearFecha(detalle.creadoEn)}</Dato>
                            {cerrada ? <Dato etiqueta="Fecha de cierre">{formatearFecha(detalle.fechaCierreReal)}</Dato> : null}
                            {detalle.estado === 'GANADA' && detalle.valorFinal != null ? <Dato etiqueta="Valor final">{formatearMonto(detalle.valorFinal, detalle.moneda)}</Dato> : null}
                            {detalle.motivoPerdida ? <Dato etiqueta="Motivo de pérdida">{detalle.motivoPerdida.nombre}</Dato> : null}
                            <Dato etiqueta="Observaciones" className="col-span-2">
                                <span className="font-normal">{detalle.observaciones || '—'}</span>
                            </Dato>
                        </dl>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default OportunidadDetalle;
