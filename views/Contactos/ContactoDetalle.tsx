'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { createClient } from '@/lib/supabase/client';
import {
    actualizarContacto,
    agregarObservacion,
    estadoContactoConfig,
    estadoLabel,
    listarInmueblesDeContacto,
    listarObservaciones,
    listarOportunidadesDeContacto,
    nombreContacto,
    nombreDeUsuario,
    obtenerContacto,
    type Contacto,
    type InmuebleDeContacto,
    type Observacion,
    type OportunidadDeContacto,
} from '@/lib/supabase/contactos';
import { estadoOportunidadConfig } from '@/lib/enums/estadoOportunidad';
import { estadoInmuebleConfig } from '@/lib/enums/estadoInmueble';
import { tipoOperacionConfig } from '@/lib/enums/tipoOperacion';
import { tipoInmuebleConfig } from '@/lib/enums/tipoInmueble';
import { formatearMonto } from '@/lib/enums/moneda';
import { formatearTelefono } from '@/lib/formato';
import { showToast } from '@/lib/ui/toast';
import Timeline from '@/components/ui/Timeline';
import EstadoChip from '@/components/ui/EstadoChip';
import ChipCategoria from '@/components/ui/ChipCategoria';
import { inicialesDe } from '@/components/ui/Iniciales';
import { AccionSecundaria, Avatar, BotonEditar, BotonNuevaOportunidad, DatoLista, EnlaceTarjeta, FichaHero, FilaRelacionada, ListaDatos, SinDato, Tarjeta } from '@/components/ui/FichaPartes';
import ContactoDetalleSkeleton from '@/views/Contactos/ContactoDetalleSkeleton';
import IconBuilding from '@/components/Icon/IconBuilding';
import IconHome from '@/components/Icon/IconHome';
import IconPhone from '@/components/Icon/IconPhone';
import IconMail from '@/components/Icon/IconMail';
import { useBreadcrumbDetalle } from '@/components/Layouts/useBreadcrumbDetalle';

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR');
const telHref = (t: string) => `tel:${t.replace(/[^\d+]/g, '')}`;

const ContactoDetalle = ({ id }: { id: string }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [contacto, setContacto] = useState<Contacto | null>(null);
    useBreadcrumbDetalle(contacto ? nombreContacto(contacto) : undefined);
    const [observaciones, setObservaciones] = useState<Observacion[]>([]);
    const [oportunidades, setOportunidades] = useState<OportunidadDeContacto[]>([]);
    const [inmuebles, setInmuebles] = useState<InmuebleDeContacto[]>([]);
    const [creador, setCreador] = useState<string | null>(null);
    const [texto, setTexto] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardandoNota, setGuardandoNota] = useState(false);
    const [creandoOportunidad, setCreandoOportunidad] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Contacto'));
    }, [dispatch]);

    const cargar = async () => {
        const supabase = createClient();
        const contactoResultado = await obtenerContacto(supabase, id);
        if ('error' in contactoResultado) {
            setError(contactoResultado.error);
            setCargando(false);
            return;
        }

        const [notasResultado, ops, inms, quien] = await Promise.all([
            listarObservaciones(supabase, id),
            listarOportunidadesDeContacto(supabase, id),
            listarInmueblesDeContacto(supabase, id),
            nombreDeUsuario(supabase, contactoResultado.contacto.creado_por),
        ]);
        setContacto(contactoResultado.contacto);
        dispatch(setPageTitle(nombreContacto(contactoResultado.contacto)));
        setOportunidades(ops);
        setInmuebles(inms);
        setCreador(quien);
        if ('error' in notasResultado) {
            setError(notasResultado.error);
        } else {
            setObservaciones(notasResultado.observaciones);
        }
        setCargando(false);
    };

    useEffect(() => {
        cargar();
        // El id de la ruta no cambia mientras el detalle está montado.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const guardarObservacion = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!contacto) {
            return;
        }
        const limpio = texto.trim();
        if (!limpio) {
            setError('Escribí la observación antes de guardarla.');
            return;
        }
        setError('');
        setGuardandoNota(true);
        const resultado = await agregarObservacion(createClient(), contacto.id, limpio);
        setGuardandoNota(false);
        if ('error' in resultado) {
            setError(resultado.error);
            return;
        }
        setTexto('');
        const notas = await listarObservaciones(createClient(), contacto.id);
        if ('error' in notas) {
            setError(notas.error);
            return;
        }
        setObservaciones(notas.observaciones);
    };

    // La oportunidad solo admite contactos interesados: si no lo es, lo marcamos antes de seguir.
    const nuevaOportunidad = async () => {
        if (!contacto) return;
        if (!contacto.es_interesado) {
            setCreandoOportunidad(true);
            const resultado = await actualizarContacto(createClient(), contacto.id, {
                nombre: contacto.nombre,
                apellido: contacto.apellido,
                email: contacto.email ?? '',
                telefono: contacto.telefono ?? '',
                estado: contacto.estado,
                es_propietario: contacto.es_propietario,
                es_interesado: true,
                observaciones: contacto.observaciones ?? '',
            });
            setCreandoOportunidad(false);
            if ('error' in resultado) {
                showToast(resultado.error, 'error');
                return;
            }
            showToast('Lo marcamos como interesado para poder crear la oportunidad.', 'success');
        }
        router.push(`/oportunidades/nuevo?contactoId=${contacto.id}`);
    };

    if (cargando) {
        return <ContactoDetalleSkeleton />;
    }

    if (!contacto) {
        return (
            <div className="panel">
                <p className="text-uk-lost dark:text-uk-lost-dark">{error || 'No encontramos ese contacto.'}</p>
                <Link href="/contactos" className="mt-4 inline-block text-primary dark:text-uk-link-dark hover:underline">
                    Volver al listado
                </Link>
            </div>
        );
    }

    const roles = [contacto.es_propietario ? 'Propietario' : null, contacto.es_interesado ? 'Interesado' : null].filter(Boolean) as string[];
    const abiertas = oportunidades.filter((o) => o.estado === 'ABIERTA').length;
    const cerradas = oportunidades.length - abiertas;

    return (
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
            <FichaHero
                avatar={<Avatar iniciales={inicialesDe(contacto.nombre, contacto.apellido)} />}
                titulo={nombreContacto(contacto)}
                debajo={
                    <>
                        {roles.map((r) => (
                            <ChipCategoria key={r} destacado>
                                {r}
                            </ChipCategoria>
                        ))}
                        <ChipCategoria>{estadoLabel[contacto.estado]}</ChipCategoria>
                    </>
                }
                acciones={
                    <>
                        <BotonEditar href={`/contactos/${contacto.id}/editar`} etiqueta="Editar contacto" />
                        {contacto.telefono ? (
                            <AccionSecundaria href={telHref(contacto.telefono)}>
                                <IconPhone className="h-4 w-4 text-primary dark:text-uk-link-dark" />
                                Llamar
                            </AccionSecundaria>
                        ) : null}
                        {contacto.email ? (
                            <AccionSecundaria href={`mailto:${contacto.email}`}>
                                <IconMail className="h-4 w-4 text-primary dark:text-uk-link-dark" />
                                Escribir email
                            </AccionSecundaria>
                        ) : null}
                        <BotonNuevaOportunidad onClick={creandoOportunidad ? undefined : nuevaOportunidad} />
                    </>
                }
                datos={[
                    {
                        etiqueta: 'Teléfono',
                        valor: contacto.telefono ? (
                            <a href={telHref(contacto.telefono)} className="hover:underline">
                                {formatearTelefono(contacto.telefono)}
                            </a>
                        ) : (
                            '—'
                        ),
                    },
                    {
                        etiqueta: 'Email',
                        valor: contacto.email ? (
                            <a href={`mailto:${contacto.email}`} className="block truncate hover:underline">
                                {contacto.email}
                            </a>
                        ) : (
                            '—'
                        ),
                    },
                    {
                        etiqueta: 'Oportunidades',
                        valor: (
                            <>
                                {abiertas} {abiertas === 1 ? 'abierta' : 'abiertas'}{' '}
                                <span className="text-[13px] font-semibold text-uk-muted dark:text-uk-muted-dark">
                                    · {cerradas} {cerradas === 1 ? 'cerrada' : 'cerradas'}
                                </span>
                            </>
                        ),
                    },
                    { etiqueta: 'Contacto desde', valor: fecha(contacto.creado_en) },
                ]}
            />

            <div className="flex flex-wrap items-start gap-5">
                <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
                    <Tarjeta titulo="Oportunidades">
                        {oportunidades.length === 0 ? (
                            <p className="text-sm text-uk-muted dark:text-uk-muted-dark">Todavía no tiene oportunidades.</p>
                        ) : (
                            oportunidades.map((o) => (
                                <FilaRelacionada
                                    key={o.id}
                                    href={`/oportunidades/${o.id}`}
                                    titulo={o.titulo}
                                    detalle={[o.etapa, o.funnel, o.inmueble].filter(Boolean).join(' · ')}
                                    medio={<EstadoChip label={estadoOportunidadConfig[o.estado].label} color={estadoOportunidadConfig[o.estado].color} />}
                                    importe={o.valorEstimado != null ? formatearMonto(o.valorEstimado, o.moneda) : undefined}
                                />
                            ))
                        )}
                    </Tarjeta>

                    <Tarjeta titulo="Inmuebles a su nombre" derecha={<EnlaceTarjeta href="/inmuebles/nuevo">+ Cargar inmueble</EnlaceTarjeta>}>
                        {inmuebles.length === 0 ? (
                            <p className="text-sm text-uk-muted dark:text-uk-muted-dark">No tiene inmuebles cargados.</p>
                        ) : (
                            inmuebles.map((i) => (
                                <FilaRelacionada
                                    key={i.id}
                                    href={`/inmuebles/${i.id}`}
                                    icono={i.tipoInmueble === 'CASA' ? <IconHome className="h-5 w-5" duotone={false} /> : <IconBuilding className="h-5 w-5" />}
                                    titulo={[i.direccion, i.localidad].filter(Boolean).join(', ')}
                                    detalle={
                                        <>
                                            <strong className="text-uk-ink dark:text-uk-ink-dark">{tipoOperacionConfig[i.tipoOperacion].label}</strong> · {tipoInmuebleConfig[i.tipoInmueble].label}
                                            {i.ambientes != null ? ` · ${i.ambientes} amb.` : ''}
                                            {i.m2 != null ? ` · ${i.m2.toLocaleString('es-AR')} m²` : ''}
                                        </>
                                    }
                                    medio={<EstadoChip label={estadoInmuebleConfig[i.estado].label} color={estadoInmuebleConfig[i.estado].color} />}
                                    importe={i.precio != null ? formatearMonto(i.precio, i.moneda) : undefined}
                                />
                            ))
                        )}
                    </Tarjeta>

                    <Tarjeta titulo="Observaciones">
                        <form className="space-y-3" onSubmit={guardarObservacion}>
                            <label htmlFor="observacion" className="!mb-0 text-[13px] font-bold">
                                Nueva observación
                            </label>
                            <textarea id="observacion" className="form-textarea w-full resize-y rounded-[9px] text-sm dark:!border-uk-field-dark dark:!bg-uk-page-dark dark:!text-uk-ink-dark" rows={3} value={texto} onChange={(event) => setTexto(event.target.value)} />
                            <button type="submit" className="btn btn-primary h-10 rounded-[10px] font-extrabold" disabled={guardandoNota}>
                                {guardandoNota ? 'Guardando…' : 'Agregar observación'}
                            </button>
                        </form>
                        {error ? <p className="text-sm font-bold text-uk-lost dark:text-uk-lost-dark">{error}</p> : null}
                        <Timeline
                            vacio="Todavía no hay observaciones."
                            items={observaciones.map((item) => ({
                                id: item.id,
                                title: item.descripcion || '—',
                                meta: `${item.autor} · ${new Date(item.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}`,
                            }))}
                        />
                    </Tarjeta>
                </div>

                <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
                    <Tarjeta compacta titulo="Datos" derecha={<EnlaceTarjeta href={`/contactos/${contacto.id}/editar`}>Editar</EnlaceTarjeta>}>
                        <ListaDatos>
                            <DatoLista etiqueta="Nombre">{contacto.nombre}</DatoLista>
                            <DatoLista etiqueta="Apellido">{contacto.apellido}</DatoLista>
                            <DatoLista etiqueta="Rol">{roles.join(' · ') || '—'}</DatoLista>
                            <DatoLista etiqueta="Estado">{estadoContactoConfig[contacto.estado].label}</DatoLista>
                            <DatoLista etiqueta="Cargado por" ancho>
                                {[creador, fecha(contacto.creado_en)].filter(Boolean).join(' · ')}
                            </DatoLista>
                            <DatoLista etiqueta="Observaciones" ancho>
                                {contacto.observaciones ? <span className="whitespace-pre-line font-normal leading-normal text-uk-ink dark:text-uk-ink-dark">{contacto.observaciones}</span> : <SinDato>Sin observaciones</SinDato>}
                            </DatoLista>
                        </ListaDatos>
                    </Tarjeta>
                </aside>
            </div>
        </div>
    );
};

export default ContactoDetalle;
