'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { createClient } from '@/lib/supabase/client';
import { ESTADOS_CONTACTO, buscarContactoPorEmail, estadoLabel, listarContextoContacto, nombreContacto, type Contacto, type ContextoContacto, type EstadoContacto } from '@/lib/supabase/contactos';
import { actualizarContactoAction, crearContactoAction, reasignarContactoAction } from '@/lib/contacto/actions';
import { LIMITES_CONTACTO, limpiarTelefono } from '@/lib/contacto/fila';
import { puedeReasignar } from '@/lib/auth/permisos';
import { showToast } from '@/lib/ui/toast';
import Select from '@/components/ui/Select';
import { useBreadcrumbDetalle } from '@/components/Layouts/useBreadcrumbDetalle';
import { Bloque, Campo, CampoConAdorno, CampoGrupo, FormularioTarjeta, PieFormulario, PildorasMultiples, Segmentado, claseInput, claseInvalido, claseTextarea } from '@/components/ui/FormPartes';

type Errores = Partial<Record<'nombre' | 'apellido' | 'telefono' | 'email' | 'rol', string>>;

interface Duplicado {
    id: string;
    nombre: string;
    apellido: string;
}

const SIN_CONTACTO = 'Cargá al menos un teléfono o un email.';
const SIN_ROL = 'Elegí al menos un rol (propietario o interesado).';

const ROLES = [
    { value: 'propietario', label: 'Propietario' },
    { value: 'interesado', label: 'Interesado' },
];

const ContactoForm = ({ contacto }: { contacto?: Contacto }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const esEdicion = !!contacto;
    useBreadcrumbDetalle(contacto ? nombreContacto(contacto) : undefined);
    const [nombre, setNombre] = useState(contacto?.nombre ?? '');
    const [apellido, setApellido] = useState(contacto?.apellido ?? '');
    const [email, setEmail] = useState(contacto?.email ?? '');
    const [telefono, setTelefono] = useState(contacto?.telefono ?? '');
    const [estado, setEstado] = useState<EstadoContacto>(contacto?.estado ?? 'POTENCIAL');
    const [esPropietario, setEsPropietario] = useState(contacto?.es_propietario ?? false);
    const [esInteresado, setEsInteresado] = useState(contacto?.es_interesado ?? false);
    const [observaciones, setObservaciones] = useState(contacto?.observaciones ?? '');
    const [origenId, setOrigenId] = useState(contacto?.origen_id ?? '');
    const [responsableId, setResponsableId] = useState(contacto?.responsable_id ?? '');
    const [ctx, setCtx] = useState<ContextoContacto | null>(null);
    const [duplicado, setDuplicado] = useState<Duplicado | null>(null);
    const [errores, setErrores] = useState<Errores>({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle(esEdicion ? 'Editar contacto' : 'Nuevo contacto'));
    }, [dispatch, esEdicion]);

    useEffect(() => {
        let vigente = true;
        listarContextoContacto(createClient()).then((cargado) => {
            if (!vigente) return;
            setCtx(cargado);
            if (!contacto && cargado.yo) setResponsableId((actual) => actual || cargado.yo!.id);
        });
        return () => {
            vigente = false;
        };
    }, [contacto]);

    const alternarRol = (rol: string) => {
        setErrores((x) => ({ ...x, rol: undefined }));
        if (rol === 'propietario') setEsPropietario((v) => !v);
        else setEsInteresado((v) => !v);
    };

    const revisarEmail = async () => {
        const valor = email.trim();
        if (!/^\S+@\S+\.\S+$/.test(valor)) {
            setDuplicado(null);
            return;
        }
        setDuplicado(await buscarContactoPorEmail(createClient(), valor, contacto?.id));
    };

    const guardar = async (crearOportunidad: boolean) => {
        setErrorGeneral('');

        const marcarInteresado = crearOportunidad && !esInteresado;
        const tieneRol = esPropietario || esInteresado || marcarInteresado;

        const e: Errores = {};
        if (!nombre.trim()) e.nombre = 'Cargá el nombre.';
        if (!apellido.trim()) e.apellido = 'Cargá el apellido.';
        if (!email.trim() && !telefono.trim()) {
            e.telefono = SIN_CONTACTO;
            e.email = SIN_CONTACTO;
        }
        if (!tieneRol) e.rol = SIN_ROL;
        setErrores(e);
        const primero = (['nombre', 'apellido', 'telefono', 'email', 'rol'] as const).find((campo) => e[campo]);
        if (primero) {
            const el = document.getElementById(primero === 'rol' ? 'rol-etiqueta' : primero);
            el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            el?.focus?.({ preventScroll: true });
            return;
        }

        const datos = {
            nombre,
            apellido,
            email,
            telefono,
            estado,
            es_propietario: esPropietario,
            es_interesado: esInteresado || marcarInteresado,
            observaciones,
            origen_id: origenId,
            responsable_id: responsableId,
        };

        setGuardando(true);
        const resultado = contacto ? await actualizarContactoAction(contacto.id, datos) : await crearContactoAction(datos);

        if (!resultado.ok || !resultado.data) {
            setGuardando(false);
            setErrorGeneral(!resultado.ok ? resultado.mensaje : 'No se pudo guardar el contacto.');
            return;
        }

        if (contacto && ctx?.yo && puedeReasignar(ctx.yo.rol) && responsableId && responsableId !== contacto.responsable_id) {
            const reasignado = await reasignarContactoAction(contacto.id, responsableId);
            if (!reasignado.ok) {
                setGuardando(false);
                setErrorGeneral(reasignado.mensaje);
                return;
            }
        }
        setGuardando(false);

        if (marcarInteresado) showToast('Lo marcamos como interesado para poder crear la oportunidad.', 'success');
        router.push(crearOportunidad ? `/oportunidades/nuevo?contactoId=${resultado.data.contacto.id}` : `/contactos/${resultado.data.contacto.id}`);
        router.refresh();
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        guardar(false);
    };

    const limpiarError = (campo: keyof Errores) => setErrores((x) => ({ ...x, [campo]: undefined }));
    const limpiarContacto = () => setErrores((x) => ({ ...x, telefono: undefined, email: undefined }));

    return (
        <div className="mx-auto flex max-w-[1080px] flex-col gap-5">
            <div className="flex flex-col gap-1">
                <h1 className="text-[26px] font-extrabold tracking-tight text-uk-ink dark:text-uk-ink-dark">{esEdicion ? 'Editar contacto' : 'Nuevo contacto'}</h1>
                <p className="text-sm text-uk-muted dark:text-uk-muted-dark">{contacto ? nombreContacto(contacto) : 'Con nombre y un teléfono o un email ya lo podés guardar.'}</p>
            </div>

            <FormularioTarjeta onSubmit={submit}>
                <Bloque titulo="Datos personales" ayuda="Cómo aparece en la lista y en las oportunidades.">
                    <Campo obligatorio id="nombre" etiqueta="Nombre" error={errores.nombre}>
                        <input
                            id="nombre"
                            type="text"
                            maxLength={LIMITES_CONTACTO.nombre}
                            value={nombre}
                            onChange={(e) => {
                                setNombre(e.target.value);
                                limpiarError('nombre');
                            }}
                            aria-invalid={Boolean(errores.nombre) || undefined}
                            aria-describedby={errores.nombre ? 'nombre-error' : undefined}
                            className={`${claseInput} ${errores.nombre ? claseInvalido : ''}`}
                        />
                    </Campo>
                    <Campo obligatorio id="apellido" etiqueta="Apellido" error={errores.apellido}>
                        <input
                            id="apellido"
                            type="text"
                            maxLength={LIMITES_CONTACTO.apellido}
                            value={apellido}
                            onChange={(e) => {
                                setApellido(e.target.value);
                                limpiarError('apellido');
                            }}
                            aria-invalid={Boolean(errores.apellido) || undefined}
                            aria-describedby={errores.apellido ? 'apellido-error' : undefined}
                            className={`${claseInput} ${errores.apellido ? claseInvalido : ''}`}
                        />
                    </Campo>
                </Bloque>

                <Bloque obligatorio titulo="Cómo contactarlo" ayuda="Cargá al menos uno: teléfono o email.">
                    <Campo id="telefono" etiqueta="Teléfono" error={errores.telefono} ayuda="Con código de área, sin 0 ni 15.">
                        <CampoConAdorno prefijo="+54" invalido={Boolean(errores.telefono)}>
                            <input
                                id="telefono"
                                type="tel"
                                maxLength={LIMITES_CONTACTO.telefono}
                                value={telefono}
                                onChange={(e) => {
                                    setTelefono(limpiarTelefono(e.target.value));
                                    limpiarContacto();
                                }}
                                placeholder="11 5555-1234"
                                aria-invalid={Boolean(errores.telefono) || undefined}
                                aria-describedby={errores.telefono ? 'telefono-error' : undefined}
                                className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm tabular-nums text-uk-ink outline-none placeholder:text-uk-muted dark:bg-uk-page-dark dark:text-uk-ink-dark dark:placeholder:text-uk-muted-dark"
                            />
                        </CampoConAdorno>
                    </Campo>
                    <Campo id="email" etiqueta="Email" error={errores.email}>
                        <input
                            id="email"
                            type="email"
                            maxLength={LIMITES_CONTACTO.email}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setDuplicado(null);
                                limpiarContacto();
                            }}
                            onBlur={revisarEmail}
                            placeholder="nombre@mail.com"
                            aria-invalid={Boolean(errores.email) || undefined}
                            aria-describedby={errores.email ? 'email-error' : duplicado ? 'email-duplicado' : undefined}
                            className={`${claseInput} ${errores.email ? claseInvalido : duplicado ? '!border-[1.5px] !border-[#E2A03F]' : ''}`}
                        />
                    </Campo>
                    {duplicado ? (
                        <div id="email-duplicado" role="status" className="flex flex-wrap items-center gap-2.5 rounded-[10px] border border-[#F3D29E] bg-[#FFF6E8] px-3 py-2.5 text-[13px] text-[#5C3A00] dark:border-warning/30 dark:bg-warning/10 dark:text-warning md:col-span-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 8v5M12 16h.01" />
                            </svg>
                            <span className="min-w-[220px] flex-1">
                                Ya hay un contacto con este email: <strong>{nombreContacto(duplicado)}</strong>.
                            </span>
                            <Link href={`/contactos/${duplicado.id}`} className="font-extrabold text-[#6B3A00] underline hover:no-underline dark:text-warning">
                                Ver contacto
                            </Link>
                        </div>
                    ) : null}
                </Bloque>

                <Bloque titulo="Clasificación" ayuda="Sirve para filtrar y para elegirlo como propietario o interesado.">
                    <CampoGrupo obligatorio id="rol-etiqueta" etiqueta="Rol" error={errores.rol} ayuda="Podés marcar los dos.">
                        <PildorasMultiples opciones={ROLES} activas={[esPropietario ? 'propietario' : '', esInteresado ? 'interesado' : '']} onToggle={alternarRol} />
                    </CampoGrupo>
                    <CampoGrupo id="estado-etiqueta" etiqueta="Estado">
                        <Segmentado etiqueta="Estado" value={estado} onChange={setEstado} opciones={ESTADOS_CONTACTO.map((item) => ({ value: item, label: estadoLabel[item] }))} />
                    </CampoGrupo>
                    <Campo id="origen" etiqueta="Origen" ayuda="De dónde llegó. Podés dejarlo vacío y completarlo después.">
                        <Select
                            id="origen"
                            alto="lg"
                            ariaLabel="Origen"
                            placeholder="Sin origen"
                            value={origenId}
                            onChange={setOrigenId}
                            onClear={() => setOrigenId('')}
                            opciones={(ctx?.origenes ?? []).map((o) => ({ value: o.id, label: o.nombre }))}
                        />
                    </Campo>
                    {ctx?.yo && puedeReasignar(ctx.yo.rol) ? (
                        <Campo id="responsable" etiqueta="Responsable" ayuda="El vendedor solo ve y edita los contactos que tiene asignados.">
                            <Select
                                id="responsable"
                                alto="lg"
                                ariaLabel="Responsable"
                                value={responsableId}
                                onChange={setResponsableId}
                                opciones={ctx.usuarios.map((u) => ({ value: u.id, label: `${u.nombre} ${u.apellido}`.trim() }))}
                            />
                        </Campo>
                    ) : (
                        <Campo id="responsable" etiqueta="Responsable" ayuda={contacto ? 'Para cambiarlo, un administrador o el responsable comercial lo reasigna.' : 'Queda asignado a vos.'}>
                            <p className="flex h-[42px] items-center text-sm font-bold text-uk-ink dark:text-uk-ink-dark">
                                {contacto?.responsable_nombre || (ctx?.yo ? `${ctx.yo.nombre} ${ctx.yo.apellido}`.trim() : '…')}
                            </p>
                        </Campo>
                    )}
                </Bloque>

                <Bloque titulo="Notas" ultimo columnas={1}>
                    <Campo id="nota" etiqueta="Nota del contacto" ayuda="Este texto queda en el contacto. Las observaciones posteriores se cargan en el detalle y no pisan esta nota.">
                        <textarea id="nota" rows={4} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Ej.: prefiere que lo llamen después de las 18" className={claseTextarea} />
                    </Campo>
                </Bloque>

                <PieFormulario>
                    {errorGeneral ? (
                        <p role="alert" className="mr-auto self-center text-sm font-bold text-uk-lost dark:text-uk-lost-dark">
                            {errorGeneral}
                        </p>
                    ) : null}
                    <button type="button" className="btn btn-cancel h-[42px] rounded-[10px] px-[18px]" onClick={() => router.push(contacto ? `/contactos/${contacto.id}` : '/contactos')}>
                        Cancelar
                    </button>
                    {!esEdicion ? (
                        <button type="button" className="btn btn-outline-primary h-[42px] rounded-[10px] px-[18px] font-extrabold" disabled={guardando} onClick={() => guardar(true)}>
                            Guardar y crear oportunidad
                        </button>
                    ) : null}
                    <button type="submit" className="btn btn-primary h-[42px] rounded-[10px] px-5 font-extrabold" disabled={guardando}>
                        {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear contacto'}
                    </button>
                </PieFormulario>
            </FormularioTarjeta>
        </div>
    );
};

export default ContactoForm;
