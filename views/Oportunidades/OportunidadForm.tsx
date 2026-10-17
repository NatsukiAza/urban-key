'use client';
import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { showToast } from '@/lib/ui/toast';
import { crearOportunidad, actualizarOportunidad } from '@/lib/oportunidad/actions';
import { tipoOperacionConfig } from '@/lib/enums/tipoOperacion';
import { tipoInmuebleConfig } from '@/lib/enums/tipoInmueble';
import type { FormOptions, Oportunidad } from '@/lib/oportunidad/types';
import type { Moneda } from '@/lib/enums/moneda';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import IconHome from '@/components/Icon/IconHome';
import IconUser from '@/components/Icon/IconUser';
import { inicialesDe } from '@/components/ui/Iniciales';
import { useBreadcrumbDetalle } from '@/components/Layouts/useBreadcrumbDetalle';

export interface ValoresIniciales {
    titulo?: string;
    contactoId?: string;
    inmuebleId?: string;
    responsableId?: string;
    funnelId?: string;
    etapaId?: string;
    valorEstimado?: number;
    moneda?: Moneda;
}

export interface PrecargaForm {
    origen: 'contacto' | 'inmueble';
    nombre: string;
    volverHref: string;
    contactoFijo: boolean;
    inmuebleFijo: boolean;
}

interface Props {
    options: FormOptions;
    oportunidad?: Oportunidad | null;
    iniciales?: ValoresIniciales;
    volverA?: string;
    precarga?: PrecargaForm;
    usuarioActualId?: string;
    funnelNombre?: string;
    puedeReasignar?: boolean;
}

type Errores = Partial<Record<'titulo' | 'funnelId' | 'etapaId' | 'contactoId' | 'responsableId', string>>;

const claseInput = 'form-input h-[42px] w-full rounded-[9px] text-sm dark:!bg-uk-page-dark dark:!border-uk-field-dark dark:!text-uk-ink-dark';
const claseInvalido = '!border-[1.5px] !border-uk-lost dark:!border-uk-lost-dark';

const Obligatorio = () => (
    <>
        <span aria-hidden="true" className="ml-0.5 text-uk-lost dark:text-uk-lost-dark">
            *
        </span>
        <span className="sr-only"> (obligatorio)</span>
    </>
);

const Campo = ({ id, etiqueta, obligatorio, error, ayuda, className = '', children }: { id: string; etiqueta: string; obligatorio?: boolean; error?: string; ayuda?: string; className?: string; children: ReactNode }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label htmlFor={id} className="!mb-0 text-[13px] font-bold text-uk-ink dark:text-uk-ink-dark">
            {etiqueta}
            {obligatorio ? <Obligatorio /> : null}
        </label>
        {children}
        {error ? (
            <p id={`${id}-error`} className="text-xs font-bold text-uk-lost dark:text-uk-lost-dark">
                {error}
            </p>
        ) : ayuda ? (
            <p className="text-xs font-semibold text-uk-muted dark:text-uk-muted-dark">{ayuda}</p>
        ) : null}
    </div>
);

const Bloque = ({ titulo, ayuda, ultimo = false, children }: { titulo: string; ayuda: string; ultimo?: boolean; children: ReactNode }) => (
    <fieldset className={`m-0 flex min-w-0 flex-wrap gap-6 border-0 p-6 ${ultimo ? '' : 'border-b border-b-uk-col dark:border-b-[#232C45]'}`}>
        <legend className="sr-only">{titulo}</legend>
        <div className="flex max-w-[240px] flex-[1_1_200px] flex-col gap-1">
            <h2 className="text-base font-extrabold text-uk-ink dark:text-uk-ink-dark">{titulo}</h2>
            <p className="text-[13px] leading-normal text-uk-muted dark:text-uk-muted-dark">{ayuda}</p>
        </div>
        <div className="grid min-w-0 flex-[999_1_420px] grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
    </fieldset>
);

const hoyIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const formatearMiles = (digitos: string) => (digitos ? Number(digitos).toLocaleString('es-AR') : '');

const OportunidadForm = ({ options, oportunidad, iniciales, volverA, precarga, usuarioActualId, funnelNombre, puedeReasignar = false }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const esEdicion = !!oportunidad;
    useBreadcrumbDetalle(oportunidad?.titulo, funnelNombre);
    useEffect(() => {
        dispatch(setPageTitle(esEdicion ? 'Editar oportunidad' : 'Nueva oportunidad'));
    });

    const valorOriginal = oportunidad?.valorEstimado ?? null;
    const [params, setParams] = useState({
        titulo: oportunidad?.titulo ?? iniciales?.titulo ?? '',
        contactoId: oportunidad?.contactoId ?? iniciales?.contactoId ?? '',
        inmuebleId: oportunidad?.inmuebleId ?? iniciales?.inmuebleId ?? '',
        responsableId: oportunidad?.responsableId ?? iniciales?.responsableId ?? '',
        funnelId: oportunidad?.funnelId ?? iniciales?.funnelId ?? '',
        etapaId: oportunidad?.etapaId ?? iniciales?.etapaId ?? '',
        valorEstimado: valorOriginal != null ? String(Math.trunc(valorOriginal)) : iniciales?.valorEstimado != null ? String(Math.trunc(iniciales.valorEstimado)) : '',
        moneda: (oportunidad?.moneda ?? iniciales?.moneda ?? 'ARS') as Moneda,
        origenId: oportunidad?.origenId ?? '',
        observaciones: oportunidad?.observaciones ?? '',
        fechaCierreEstimada: oportunidad?.fechaCierreEstimada ?? '',
    });
    const [errores, setErrores] = useState<Errores>({});
    const [guardando, setGuardando] = useState(false);
    const [contactoDesbloqueado, setContactoDesbloqueado] = useState(false);

    const set = <K extends keyof typeof params>(campo: K, valor: (typeof params)[K]) => {
        setParams((p) => ({ ...p, [campo]: valor }));
        if (campo in errores) setErrores((e) => ({ ...e, [campo]: undefined }));
    };

    const onFunnelChange = (value: string) => {
        setParams((p) => ({ ...p, funnelId: value, etapaId: '' }));
        setErrores((e) => ({ ...e, funnelId: undefined, etapaId: undefined }));
    };

    // En el form solo se ofrecen etapas ABIERTAS del funnel elegido (ganar/perder va por el tablero o el detalle).
    const etapasDisponibles = useMemo(() => options.etapas.filter((e) => e.funnelId === params.funnelId && e.resultado === 'ABIERTA').sort((a, b) => a.orden - b.orden), [options.etapas, params.funnelId]);

    const contacto = options.interesados.find((c) => c.id === params.contactoId);
    const contactoFijo = Boolean(precarga?.contactoFijo && contacto && !contactoDesbloqueado);

    const validar = (): Errores => {
        const e: Errores = {};
        if (!params.titulo.trim()) e.titulo = 'Poné un título para identificarla en el tablero.';
        if (!params.funnelId) e.funnelId = 'Elegí en qué funnel arranca.';
        else if (!params.etapaId) e.etapaId = 'Elegí la etapa en la que está hoy.';
        if (!params.contactoId) e.contactoId = 'Elegí el contacto de la oportunidad.';
        if (!params.responsableId) e.responsableId = 'Elegí quién la lleva adelante.';
        return e;
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const e = validar();
        setErrores(e);
        const primero = (['titulo', 'funnelId', 'etapaId', 'contactoId', 'responsableId'] as const).find((campo) => e[campo]);
        if (primero) {
            const el = document.getElementById(primero);
            el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            el?.focus({ preventScroll: true });
            return;
        }

        setGuardando(true);
        const digitos = params.valorEstimado;
        const input = {
            titulo: params.titulo.trim(),
            contactoId: params.contactoId,
            inmuebleId: params.inmuebleId || null,
            responsableId: params.responsableId,
            funnelId: params.funnelId,
            etapaId: params.etapaId,
            valorEstimado: digitos === '' ? null : valorOriginal != null && digitos === String(Math.trunc(valorOriginal)) ? valorOriginal : Number(digitos),
            moneda: params.moneda,
            origenId: params.origenId || null,
            observaciones: params.observaciones || null,
            fechaCierreEstimada: params.fechaCierreEstimada || null,
        };
        const res = esEdicion ? await actualizarOportunidad(oportunidad!.id, input) : await crearOportunidad(input);
        setGuardando(false);
        if (res.ok) {
            showToast(res.mensaje ?? '', 'success');
            const id = esEdicion ? oportunidad!.id : (res.data as { id: string } | undefined)?.id;
            router.push(id ? `/oportunidades/${id}` : '/oportunidades');
            router.refresh();
        } else {
            showToast(res.mensaje ?? 'No se pudo guardar', 'error');
        }
    };

    const etiquetaInmueble = (i: FormOptions['inmuebles'][number]) => ({
        value: i.id,
        label: i.direccion,
        detalle: [tipoOperacionConfig[i.tipoOperacion].label, tipoInmuebleConfig[i.tipoInmueble].label, i.m2 != null ? `${i.m2} m²` : null].filter(Boolean).join(' · '),
    });

    const titulo = esEdicion ? 'Editar oportunidad' : 'Nueva oportunidad';

    return (
        <div className="mx-auto flex max-w-[1080px] flex-col gap-5">
            <h1 className="text-[26px] font-extrabold tracking-tight text-uk-ink dark:text-uk-ink-dark">{titulo}</h1>

            {precarga && !esEdicion ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E3CFE7] bg-primary-light px-4 py-3 text-sm text-uk-ink dark:border-uk-link-dark/20 dark:bg-uk-link-dark/10 dark:text-uk-ink-dark">
                    <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-white text-xs font-extrabold text-primary dark:bg-white/10 dark:text-uk-link-dark">{inicialesDe(precarga.nombre)}</span>
                    <span className="min-w-[200px] flex-1">
                        Creando desde {precarga.origen === 'contacto' ? 'el contacto' : 'el inmueble'} <strong>{precarga.nombre}</strong>.{' '}
                        {precarga.contactoFijo && precarga.inmuebleFijo ? 'Ya completamos el contacto y su inmueble.' : precarga.origen === 'contacto' ? 'Ya completamos el contacto.' : 'Ya completamos el inmueble.'}
                    </span>
                    <Link href={precarga.volverHref} className="text-[13px] font-extrabold text-primary underline hover:no-underline dark:text-uk-link-dark">
                        {precarga.origen === 'contacto' ? 'Volver al contacto' : 'Volver al inmueble'}
                    </Link>
                </div>
            ) : null}

            <form onSubmit={submit} noValidate className="flex flex-col rounded-[14px] border border-uk-line bg-white shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:border-[#232C45] dark:bg-uk-card-dark dark:shadow-none">
                <Bloque titulo="Básico" ayuda="Con qué nombre la vas a reconocer en el tablero y en qué funnel arranca.">
                    <Campo obligatorio id="titulo" etiqueta="Título" error={errores.titulo} className="md:col-span-2">
                        <input
                            id="titulo"
                            type="text"
                            value={params.titulo}
                            onChange={(e) => set('titulo', e.target.value)}
                            placeholder="Ej.: Venta casa Castelar"
                            aria-invalid={Boolean(errores.titulo) || undefined}
                            aria-describedby={errores.titulo ? 'titulo-error' : undefined}
                            className={`${claseInput} ${errores.titulo ? claseInvalido : ''}`}
                        />
                    </Campo>
                    <Campo obligatorio id="funnelId" etiqueta="Funnel" error={errores.funnelId}>
                        <Select
                            id="funnelId"
                            alto="lg"
                            ariaLabel="Funnel"
                            placeholder="Elegí un funnel"
                            invalido={Boolean(errores.funnelId)}
                            describedBy={errores.funnelId ? 'funnelId-error' : undefined}
                            value={params.funnelId}
                            onChange={onFunnelChange}
                            opciones={options.funnels.map((f) => ({ value: f.id, label: f.nombre }))}
                        />
                    </Campo>
                    <Campo obligatorio id="etapaId" etiqueta={esEdicion ? 'Etapa' : 'Etapa inicial'} error={errores.etapaId} ayuda="Cambia según el funnel elegido.">
                        <Select
                            id="etapaId"
                            alto="lg"
                            ariaLabel="Etapa"
                            disabled={!params.funnelId}
                            placeholder={params.funnelId ? 'Elegí una etapa' : 'Elegí un funnel primero'}
                            invalido={Boolean(errores.etapaId)}
                            describedBy={errores.etapaId ? 'etapaId-error' : undefined}
                            value={params.etapaId}
                            onChange={(v) => set('etapaId', v)}
                            opciones={etapasDisponibles.map((e) => ({ value: e.id, label: e.nombre }))}
                        />
                    </Campo>
                    <Campo id="origenId" etiqueta="Origen">
                        <Select
                            id="origenId"
                            alto="lg"
                            ariaLabel="Origen"
                            placeholder="Sin origen"
                            value={params.origenId}
                            onChange={(v) => set('origenId', v)}
                            onClear={() => set('origenId', '')}
                            opciones={options.origenes.map((o) => ({ value: o.id, label: o.nombre }))}
                        />
                    </Campo>
                </Bloque>

                <Bloque titulo="Personas" ayuda="Quién es el cliente y quién la lleva adelante.">
                    <Campo obligatorio id="contactoId" etiqueta="Contacto" error={errores.contactoId}>
                        {contactoFijo && contacto ? (
                            <div id="contactoId" tabIndex={-1} className="flex h-[42px] items-center gap-2 rounded-[9px] border border-uk-field bg-uk-page pl-2 pr-1.5 dark:border-uk-field-dark dark:bg-uk-page-dark">
                                <span className="grid h-[26px] w-[26px] shrink-0 place-content-center rounded-full bg-primary-light text-[10px] font-extrabold text-primary dark:bg-[#3A2541] dark:text-[#E9D3EE]">
                                    {inicialesDe(contacto.nombre, contacto.apellido)}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm font-bold text-uk-ink dark:text-uk-ink-dark">
                                    {contacto.nombre} {contacto.apellido}
                                </span>
                                <button type="button" onClick={() => setContactoDesbloqueado(true)} className="h-[30px] rounded-[7px] px-2.5 text-[13px] font-extrabold text-primary hover:bg-primary-light dark:text-uk-link-dark dark:hover:bg-white/10">
                                    Cambiar
                                </button>
                            </div>
                        ) : (
                            <Select
                                id="contactoId"
                                alto="lg"
                                icono={
                                    contacto ? (
                                        <span className="grid h-[26px] w-[26px] place-content-center rounded-full bg-primary-light text-[10px] font-extrabold text-primary dark:bg-[#3A2541] dark:text-[#E9D3EE]">
                                            {inicialesDe(contacto.nombre, contacto.apellido)}
                                        </span>
                                    ) : (
                                        <IconUser className="h-4 w-4" duotone={false} />
                                    )
                                }
                                ariaLabel="Contacto"
                                placeholder="Elegí un contacto"
                                invalido={Boolean(errores.contactoId)}
                                describedBy={errores.contactoId ? 'contactoId-error' : undefined}
                                value={params.contactoId}
                                onChange={(v) => set('contactoId', v)}
                                opciones={options.interesados.map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))}
                            />
                        )}
                    </Campo>
                    <Campo obligatorio id="responsableId" etiqueta="Responsable" error={errores.responsableId}>
                        <Select
                            id="responsableId"
                            alto="lg"
                            ariaLabel="Responsable"
                            placeholder="Elegí un responsable"
                            disabled={!puedeReasignar}
                            invalido={Boolean(errores.responsableId)}
                            describedBy={errores.responsableId ? 'responsableId-error' : undefined}
                            value={params.responsableId}
                            onChange={(v) => set('responsableId', v)}
                            opciones={options.usuarios.map((u) => ({ value: u.id, label: `${u.nombre} ${u.apellido}${u.id === usuarioActualId ? ' (vos)' : ''}` }))}
                        />
                    </Campo>
                </Bloque>

                <Bloque titulo="Inmueble y valor" ayuda="Si todavía no hay inmueble, lo podés asociar después.">
                    <Campo id="inmuebleId" etiqueta="Inmueble" className="md:col-span-2">
                        <Select
                            id="inmuebleId"
                            alto="lg"
                            icono={<IconHome className="h-4 w-4" duotone={false} />}
                            ariaLabel="Inmueble"
                            placeholder="Sin inmueble"
                            value={params.inmuebleId}
                            onChange={(v) => set('inmuebleId', v)}
                            onClear={() => set('inmuebleId', '')}
                            opciones={options.inmuebles.map(etiquetaInmueble)}
                        />
                    </Campo>
                    <Campo id="valorEstimado" etiqueta="Valor estimado">
                        <div className="flex h-[42px] overflow-hidden rounded-[9px] border border-uk-field dark:border-uk-field-dark">
                            <div role="radiogroup" aria-label="Moneda" className="flex gap-0.5 border-r border-uk-field bg-[#FBF6EE] p-1 dark:border-uk-field-dark dark:bg-gold/10">
                                {(['USD', 'ARS'] as const).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        role="radio"
                                        aria-checked={params.moneda === m}
                                        onClick={() => set('moneda', m)}
                                        className={`h-8 rounded-md px-2.5 text-xs text-uk-money dark:text-uk-money-dark ${
                                            params.moneda === m ? 'bg-white font-extrabold shadow-[0_1px_2px_rgba(30,15,40,.12)] dark:bg-gold/20 dark:shadow-none' : 'font-bold'
                                        }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <input
                                id="valorEstimado"
                                type="text"
                                inputMode="numeric"
                                value={formatearMiles(params.valorEstimado)}
                                onChange={(e) => set('valorEstimado', e.target.value.replace(/\D/g, ''))}
                                placeholder="0"
                                className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[15px] font-extrabold tabular-nums text-uk-ink outline-none placeholder:font-normal dark:bg-uk-page-dark dark:text-uk-ink-dark"
                            />
                        </div>
                    </Campo>
                    <Campo id="fechaCierreEstimada" etiqueta="Fecha estimada de cierre">
                        <DatePicker id="fechaCierreEstimada" ariaLabel="Fecha estimada de cierre" min={hoyIso} value={params.fechaCierreEstimada} onChange={(v) => set('fechaCierreEstimada', v)} />
                    </Campo>
                </Bloque>

                <Bloque titulo="Observaciones" ayuda="Lo que tu equipo tiene que saber." ultimo>
                    <Campo id="observaciones" etiqueta="Observaciones" className="md:col-span-2">
                        <textarea
                            id="observaciones"
                            rows={4}
                            value={params.observaciones}
                            onChange={(e) => set('observaciones', e.target.value)}
                            placeholder="Ej.: quiere vender antes de fin de año"
                            className="form-textarea w-full resize-y rounded-[9px] text-sm dark:!border-uk-field-dark dark:!bg-uk-page-dark dark:!text-uk-ink-dark"
                        />
                    </Campo>
                </Bloque>

                <div className="z-10 flex flex-wrap justify-end gap-2 rounded-b-[14px] border-t border-uk-line bg-[#FBFAFC] px-6 py-4 dark:border-[#232C45] dark:bg-[#121A2C] max-md:sticky max-md:bottom-0 max-md:rounded-none">
                    <button type="button" className="btn btn-cancel h-[42px] rounded-[10px] px-[18px]" onClick={() => router.push(volverA ?? (esEdicion ? `/oportunidades/${oportunidad!.id}` : '/oportunidades'))}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary h-[42px] rounded-[10px] px-5 font-extrabold" disabled={guardando}>
                        {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear oportunidad'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OportunidadForm;
