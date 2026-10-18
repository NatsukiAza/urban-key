'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { darDeBajaInmueble } from '@/lib/inmueble/actions';
import { showToast } from '@/lib/ui/toast';
import { modalDarDeBaja } from '@/lib/ui/modales';
import { tipoOperacionConfig } from '@/lib/enums/tipoOperacion';
import { tipoInmuebleConfig } from '@/lib/enums/tipoInmueble';
import { estadoInmuebleConfig } from '@/lib/enums/estadoInmueble';
import { estadoOportunidadConfig } from '@/lib/enums/estadoOportunidad';
import { formatearImporte, formatearMonto } from '@/lib/enums/moneda';
import { formatearTelefono } from '@/lib/formato';
import type { InmuebleDetalle as TDetalle } from '@/lib/inmueble/types';
import EstadoChip from '@/components/ui/EstadoChip';
import ChipCategoria from '@/components/ui/ChipCategoria';
import MenuFilaTabla from '@/components/ui/MenuFilaTabla';
import { inicialesDe } from '@/components/ui/Iniciales';
import { Avatar, BotonEditar, BotonNuevaOportunidad, DatoLista, FichaHero, FilaRelacionada, ListaDatos, SinDato, Tarjeta, EnlaceTarjeta } from '@/components/ui/FichaPartes';
import IconBuilding from '@/components/Icon/IconBuilding';
import IconHome from '@/components/Icon/IconHome';
import IconPhone from '@/components/Icon/IconPhone';
import IconMail from '@/components/Icon/IconMail';
import { useBreadcrumbDetalle } from '@/components/Layouts/useBreadcrumbDetalle';

interface Props {
    detalle: TDetalle;
}

const fmtNumero = (v: number | null, sufijo = '') => (v != null ? `${v.toLocaleString('es-AR')}${sufijo}` : '—');
const telHref = (t: string) => `tel:${t.replace(/[^\d+]/g, '')}`;

const InmuebleDetalle = ({ detalle }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useBreadcrumbDetalle(detalle.direccion);
    useEffect(() => {
        dispatch(setPageTitle('Detalle de inmueble'));
    });

    const abiertas = detalle.oportunidades.filter((o) => o.estado === 'ABIERTA').length;
    const editarHref = `/inmuebles/${detalle.id}/editar`;

    const darDeBaja = async () => {
        if (abiertas > 0) {
            showToast('No se puede dar de baja: tiene oportunidades abiertas.', 'error');
            return;
        }
        const confirmado = await modalDarDeBaja(detalle.direccion, 'Se conserva el historial. No se puede si tiene oportunidades abiertas.');
        if (!confirmado) return;
        const res = await darDeBajaInmueble(detalle.id);
        showToast(res.mensaje ?? '', res.ok ? 'success' : 'error');
        if (res.ok) {
            router.push('/inmuebles');
            router.refresh();
        }
    };

    const propietario = detalle.propietario;
    const nombrePropietario = propietario ? `${propietario.nombre} ${propietario.apellido}` : null;
    const roles = propietario ? [propietario.esPropietario ? 'Propietario' : null, propietario.esInteresado ? 'Interesado' : null].filter(Boolean).join(' · ') : '';
    const esAlquiler = detalle.tipoOperacion === 'ALQUILER';
    const precioPorM2 = !esAlquiler && detalle.precio != null && detalle.m2 ? Math.round(detalle.precio / detalle.m2) : null;

    const distribucion =
        detalle.ambientes == null ? (
            '—'
        ) : detalle.ambientes === 1 ? (
            'Monoamb.'
        ) : (
            <>
                {detalle.ambientes} amb.{' '}
                <span className="text-[13px] font-semibold text-uk-muted dark:text-uk-muted-dark">{detalle.dormitorios != null ? `· ${detalle.dormitorios} dorm.` : '· dorm. sin cargar'}</span>
            </>
        );

    return (
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
            <FichaHero
                avatar={
                    <Avatar cuadrado>
                        {detalle.tipoInmueble === 'CASA' ? <IconHome className="h-7 w-7" duotone={false} /> : <IconBuilding className="h-7 w-7" />}
                    </Avatar>
                }
                titulo={detalle.direccion}
                junto={<EstadoChip label={estadoInmuebleConfig[detalle.estado].label} color={estadoInmuebleConfig[detalle.estado].color} />}
                debajo={
                    <>
                        {detalle.localidad ? (
                            <>
                                <span>{detalle.localidad}</span>
                                <span aria-hidden="true">·</span>
                            </>
                        ) : null}
                        <ChipCategoria destacado>{tipoOperacionConfig[detalle.tipoOperacion].label}</ChipCategoria>
                        <ChipCategoria>{tipoInmuebleConfig[detalle.tipoInmueble].label}</ChipCategoria>
                    </>
                }
                acciones={
                    <>
                        <BotonEditar href={editarHref} etiqueta="Editar inmueble" />
                        <MenuFilaTabla ariaLabel="Más acciones" items={[{ etiqueta: 'Dar de baja', destructivo: true, onClick: darDeBaja }]} />
                        <BotonNuevaOportunidad href={`/oportunidades/nuevo?inmuebleId=${detalle.id}`} />
                    </>
                }
                datos={[
                    {
                        etiqueta: esAlquiler ? 'Alquiler mensual' : 'Precio',
                        valor: detalle.precio != null ? formatearMonto(detalle.precio, detalle.moneda) : '—',
                        grande: true,
                    },
                    { etiqueta: 'Distribución', valor: distribucion },
                    {
                        etiqueta: 'Superficie',
                        valor: (
                            <>
                                {fmtNumero(detalle.m2, ' m²')}
                                {precioPorM2 != null ? <span className="text-[13px] font-semibold text-uk-muted dark:text-uk-muted-dark"> · {formatearMonto(precioPorM2, detalle.moneda)}/m²</span> : null}
                            </>
                        ),
                    },
                    {
                        etiqueta: 'Propietario',
                        valor: propietario ? (
                            <span className="flex items-center gap-2">
                                <span className="grid h-7 w-7 shrink-0 place-content-center rounded-full bg-primary-light text-[11px] font-extrabold text-primary dark:bg-white/10 dark:text-uk-link-dark">{inicialesDe(propietario.nombre, propietario.apellido)}</span>
                                <Link href={`/contactos/${propietario.id}`} className="truncate hover:underline">
                                    {nombrePropietario}
                                </Link>
                            </span>
                        ) : (
                            '—'
                        ),
                    },
                ]}
            />

            <div className="flex flex-wrap items-start gap-5">
                <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
                    <Tarjeta titulo="Oportunidades con este inmueble" derecha={abiertas > 0 ? <span className="text-[13px] text-uk-muted dark:text-uk-muted-dark">{abiertas} {abiertas === 1 ? 'abierta' : 'abiertas'}</span> : undefined}>
                        {detalle.oportunidades.length === 0 ? (
                            <p className="text-sm text-uk-muted dark:text-uk-muted-dark">Este inmueble todavía no tiene oportunidades asociadas.</p>
                        ) : (
                            detalle.oportunidades.map((o) => (
                                <FilaRelacionada
                                    key={o.id}
                                    href={`/oportunidades/${o.id}`}
                                    titulo={o.titulo}
                                    detalle={[o.contacto, o.etapa, o.funnel].filter(Boolean).join(' · ')}
                                    medio={<EstadoChip label={estadoOportunidadConfig[o.estado].label} color={estadoOportunidadConfig[o.estado].color} />}
                                    importe={o.valorEstimado != null ? formatearMonto(o.valorEstimado, o.moneda) : undefined}
                                />
                            ))
                        )}
                    </Tarjeta>
                </div>

                <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
                    {propietario ? (
                        <Tarjeta compacta titulo="Propietario">
                            <div className="flex items-center gap-3">
                                <span className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-primary-light text-sm font-extrabold text-primary dark:bg-white/10 dark:text-uk-link-dark">{inicialesDe(propietario.nombre, propietario.apellido)}</span>
                                <div className="flex min-w-0 flex-col">
                                    <Link href={`/contactos/${propietario.id}`} className="truncate text-[15px] font-extrabold text-primary hover:underline dark:text-uk-link-dark">
                                        {nombrePropietario}
                                    </Link>
                                    {roles ? <span className="text-xs text-uk-muted dark:text-uk-muted-dark">{roles}</span> : null}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 text-sm">
                                {propietario.telefono ? (
                                    <a href={telHref(propietario.telefono)} className="flex items-center gap-2 tabular-nums text-uk-ink hover:underline dark:text-uk-ink-dark">
                                        <IconPhone className="h-[15px] w-[15px] text-uk-muted dark:text-uk-muted-dark" />
                                        {formatearTelefono(propietario.telefono)}
                                    </a>
                                ) : null}
                                {propietario.email ? (
                                    <a href={`mailto:${propietario.email}`} className="flex min-w-0 items-center gap-2 text-uk-ink hover:underline dark:text-uk-ink-dark">
                                        <IconMail className="h-[15px] w-[15px] shrink-0 text-uk-muted dark:text-uk-muted-dark" />
                                        <span className="truncate">{propietario.email}</span>
                                    </a>
                                ) : null}
                            </div>
                        </Tarjeta>
                    ) : null}

                    <Tarjeta compacta titulo="Datos" derecha={<EnlaceTarjeta href={editarHref}>Editar</EnlaceTarjeta>}>
                        <ListaDatos>
                            <DatoLista etiqueta="Dirección" ancho>
                                {[detalle.direccion, detalle.localidad].filter(Boolean).join(', ')}
                            </DatoLista>
                            <DatoLista etiqueta="Operación">{tipoOperacionConfig[detalle.tipoOperacion].label}</DatoLista>
                            <DatoLista etiqueta="Tipo">{tipoInmuebleConfig[detalle.tipoInmueble].label}</DatoLista>
                            <DatoLista etiqueta="Ambientes">{fmtNumero(detalle.ambientes)}</DatoLista>
                            <DatoLista etiqueta="Dormitorios">
                                {detalle.dormitorios != null ? (
                                    detalle.dormitorios
                                ) : (
                                    <SinDato>
                                        Sin cargar ·{' '}
                                        <Link href={editarHref} className="font-extrabold not-italic text-primary hover:underline dark:text-uk-link-dark">
                                            Completar
                                        </Link>
                                    </SinDato>
                                )}
                            </DatoLista>
                            <DatoLista etiqueta="Baños">{fmtNumero(detalle.banos)}</DatoLista>
                            <DatoLista etiqueta="Cochera">{detalle.cochera ? 'Sí' : 'No'}</DatoLista>
                            <DatoLista etiqueta="Antigüedad">{detalle.antiguedad != null ? (detalle.antiguedad === 0 ? 'A estrenar' : `${detalle.antiguedad} años`) : '—'}</DatoLista>
                            <DatoLista etiqueta="Expensas">{formatearImporte(detalle.expensas, detalle.moneda)}</DatoLista>
                            <DatoLista etiqueta="Nombre interno">{detalle.nombre || '—'}</DatoLista>
                            <DatoLista etiqueta="Alta" ancho>
                                {new Date(detalle.creadoEn).toLocaleDateString('es-AR')}
                            </DatoLista>
                            <DatoLista etiqueta="Observaciones" ancho>
                                {detalle.descripcion ? <span className="whitespace-pre-line font-normal leading-normal">{detalle.descripcion}</span> : <SinDato>Sin observaciones</SinDato>}
                            </DatoLista>
                        </ListaDatos>
                    </Tarjeta>
                </aside>
            </div>
        </div>
    );
};

export default InmuebleDetalle;
