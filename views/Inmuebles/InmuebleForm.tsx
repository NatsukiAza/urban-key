'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { showToast } from '@/lib/ui/toast';
import { crearInmueble, actualizarInmueble } from '@/lib/inmueble/actions';
import { tipoOperacionOptions, type TipoOperacion } from '@/lib/enums/tipoOperacion';
import { tipoInmuebleOptions, type TipoInmueble } from '@/lib/enums/tipoInmueble';
import { estadoInmuebleOptions, type EstadoInmueble } from '@/lib/enums/estadoInmueble';
import { monedaOptions, type Moneda } from '@/lib/enums/moneda';
import type { Inmueble, InmuebleFormOptions } from '@/lib/inmueble/types';
import { createClient } from '@/lib/supabase/client';
import { crearContacto } from '@/lib/supabase/contactos';
import { modalNuevoContacto } from '@/lib/ui/modales';
import type { Contacto } from '@/lib/dominio';
import Select from '@/components/ui/Select';
import BuscadorContacto from '@/components/ui/BuscadorContacto';
import IconHome from '@/components/Icon/IconHome';
import IconBuilding from '@/components/Icon/IconBuilding';
import { Bloque, Campo, CampoConAdorno, CampoGrupo, FormularioTarjeta, PieFormulario, PildorasMultiples, Segmentado, Stepper, TarjetasOpcion, claseInput, claseInputAdorno, claseInvalido, claseTextarea, formatearMiles } from '@/components/ui/FormPartes';

interface Props {
    options: InmuebleFormOptions;
    inmueble?: Inmueble | null;
}

type CampoError = 'direccion' | 'ambientes' | 'dormitorios' | 'banos' | 'antiguedad' | 'precio' | 'estado' | 'contactoId';
type Errores = Partial<Record<CampoError, string>>;

const ORDEN_CAMPOS: CampoError[] = ['direccion', 'ambientes', 'dormitorios', 'banos', 'antiguedad', 'precio', 'estado', 'contactoId'];

const texto = (v: string | null | undefined) => v ?? '';
const numero = (v: number | null | undefined) => (v != null ? String(v) : '');
const importe = (v: number | null | undefined) => (v != null ? String(Math.trunc(v)) : '');

const iconoTipo: Record<TipoInmueble, React.ReactNode> = {
    DEPARTAMENTO: <IconBuilding className="h-[22px] w-[22px]" />,
    CASA: <IconHome className="h-[22px] w-[22px]" duotone={false} />,
    PH: <IconBuilding className="h-[22px] w-[22px]" />,
};

// Si el usuario no tocó el importe se manda el valor original, para no perder decimales.
const importeParaEnviar = (digitos: string, original: number | null | undefined) => (digitos !== '' && original != null && digitos === String(Math.trunc(original)) ? original : digitos);

const InmuebleForm = ({ options, inmueble }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const esEdicion = !!inmueble;
    useEffect(() => {
        dispatch(setPageTitle(esEdicion ? 'Editar inmueble' : 'Nuevo inmueble'));
    });

    const [params, setParams] = useState({
        contactoId: inmueble?.contactoId ?? '',
        nombre: texto(inmueble?.nombre),
        direccion: texto(inmueble?.direccion),
        localidad: texto(inmueble?.localidad),
        tipoOperacion: (inmueble?.tipoOperacion ?? 'VENTA') as TipoOperacion,
        tipoInmueble: (inmueble?.tipoInmueble ?? 'DEPARTAMENTO') as TipoInmueble,
        estado: (inmueble?.estado ?? 'DISPONIBLE') as EstadoInmueble,
        ambientes: numero(inmueble?.ambientes),
        dormitorios: numero(inmueble?.dormitorios),
        banos: numero(inmueble?.banos),
        m2: numero(inmueble?.m2),
        cochera: inmueble?.cochera ?? false,
        antiguedad: numero(inmueble?.antiguedad),
        precio: importe(inmueble?.precio),
        moneda: (inmueble?.moneda ?? 'ARS') as Moneda,
        expensas: importe(inmueble?.expensas),
        descripcion: texto(inmueble?.descripcion),
    });
    const [propietarios, setPropietarios] = useState<Contacto[]>(options.propietarios);
    const [errores, setErrores] = useState<Errores>({});
    const [guardando, setGuardando] = useState(false);

    const set = <K extends keyof typeof params>(campo: K, valor: (typeof params)[K]) => {
        setParams((p) => ({ ...p, [campo]: valor }));
        if (campo in errores) setErrores((e) => ({ ...e, [campo]: undefined }));
    };

    const crearPropietario = async (busqueda: string) => {
        const datos = await modalNuevoContacto({ titulo: 'Nuevo propietario', ayuda: 'Se guarda como contacto propietario.', confirmar: 'Crear contacto', busqueda });
        if (!datos) return;
        const resultado = await crearContacto(createClient(), { ...datos, estado: 'POTENCIAL', es_propietario: true, es_interesado: false, observaciones: '' });
        if ('error' in resultado) {
            showToast(resultado.error, 'error');
            return;
        }
        const c = resultado.contacto;
        setPropietarios((lista) => [...lista, { id: c.id, nombre: c.nombre, apellido: c.apellido, email: c.email ?? '', telefono: c.telefono ?? '', estado: c.estado, esPropietario: true, esInteresado: c.es_interesado, activo: c.activo }]);
        set('contactoId', c.id);
        showToast('Contacto creado y elegido como propietario.', 'success');
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nuevos: Errores = {};
        if (!params.direccion.trim()) nuevos.direccion = 'Cargá la dirección: es el nombre del inmueble en toda la app.';
        if (!params.ambientes || Number(params.ambientes) < 1) nuevos.ambientes = 'Indicá cuántos ambientes tiene.';
        if (!params.dormitorios || Number(params.dormitorios) < 1) nuevos.dormitorios = 'Indicá cuántos dormitorios tiene.';
        if (params.banos === '') nuevos.banos = 'Indicá cuántos baños tiene.';
        if (params.antiguedad === '') nuevos.antiguedad = 'Indicá la antigüedad (0 si es a estrenar).';
        if (!params.precio || Number(params.precio) <= 0) nuevos.precio = esAlquiler ? 'Cargá el alquiler mensual.' : 'Cargá el precio de venta.';
        if (!params.estado) nuevos.estado = 'Elegí el estado comercial.';
        if (!params.contactoId || !propietarios.some((c) => c.id === params.contactoId)) nuevos.contactoId = 'Elegí un contacto de la lista o creá uno nuevo.';
        setErrores(nuevos);
        const primero = ORDEN_CAMPOS.find((campo) => nuevos[campo]);
        if (primero) {
            const el = document.getElementById(primero);
            el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            el?.focus({ preventScroll: true });
            return;
        }

        setGuardando(true);
        // Los numéricos vacíos viajan como '' y el esquema los normaliza a null.
        const input = {
            ...params,
            m2: params.m2.replace(',', '.'),
            precio: importeParaEnviar(params.precio, inmueble?.precio),
            expensas: importeParaEnviar(params.expensas, inmueble?.expensas),
        };
        const res = esEdicion ? await actualizarInmueble(inmueble!.id, input as any) : await crearInmueble(input as any);
        setGuardando(false);
        if (res.ok) {
            showToast(res.mensaje ?? '');
            router.push(esEdicion ? `/inmuebles/${inmueble!.id}` : '/inmuebles');
            router.refresh();
        } else {
            showToast(res.mensaje ?? 'No se pudo guardar', 'error');
        }
    };

    const titulo = esEdicion ? 'Editar inmueble' : 'Nuevo inmueble';
    const esAlquiler = params.tipoOperacion === 'ALQUILER';

    return (
        <div className="mx-auto flex max-w-[1080px] flex-col gap-5">
            <div className="flex flex-col gap-1">
                <h1 className="text-[26px] font-extrabold tracking-tight text-uk-ink dark:text-uk-ink-dark">{titulo}</h1>
                <p className="text-sm text-uk-muted dark:text-uk-muted-dark">{esEdicion ? 'Los cambios se ven en la lista, el tablero y el detalle.' : 'Cargalo para poder asociarlo a oportunidades.'}</p>
            </div>

            <FormularioTarjeta onSubmit={submit}>
                <Bloque titulo="Operación y tipo" ayuda="Define en qué listados y funnels aparece." columnas={1}>
                    <CampoGrupo obligatorio id="operacion-etiqueta" etiqueta="Operación">
                        <Segmentado grande etiqueta="Operación" value={params.tipoOperacion} onChange={(v) => set('tipoOperacion', v)} opciones={tipoOperacionOptions} />
                    </CampoGrupo>
                    <CampoGrupo obligatorio id="tipo-etiqueta" etiqueta="Tipo">
                        <TarjetasOpcion etiqueta="Tipo" value={params.tipoInmueble} onChange={(v) => set('tipoInmueble', v)} opciones={tipoInmuebleOptions.map((o) => ({ ...o, icono: iconoTipo[o.value] }))} />
                    </CampoGrupo>
                </Bloque>

                <Bloque titulo="Ubicación" ayuda="La dirección es el nombre del inmueble en toda la app.">
                    <Campo obligatorio id="direccion" etiqueta="Dirección" error={errores.direccion} className="md:col-span-2">
                        <input
                            id="direccion"
                            type="text"
                            value={params.direccion}
                            onChange={(e) => set('direccion', e.target.value)}
                            placeholder="Calle y número"
                            aria-invalid={Boolean(errores.direccion) || undefined}
                            aria-describedby={errores.direccion ? 'direccion-error' : undefined}
                            className={`${claseInput} ${errores.direccion ? claseInvalido : ''}`}
                        />
                    </Campo>
                    <Campo id="localidad" etiqueta="Localidad">
                        <input id="localidad" type="text" value={params.localidad} onChange={(e) => set('localidad', e.target.value)} placeholder="Ej.: Morón" className={claseInput} />
                    </Campo>
                    <Campo id="nombre" etiqueta="Nombre interno" ayuda="Para reconocerlo en el equipo.">
                        <input id="nombre" type="text" value={params.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej.: Dto. Rivadavia" className={claseInput} />
                    </Campo>
                </Bloque>

                <Bloque titulo="Características" ayuda="Se muestran como “3 amb. · 2 dorm. · 78 m²”." columnas={3}>
                    <Campo obligatorio id="ambientes" etiqueta="Ambientes" error={errores.ambientes}>
                        <Stepper id="ambientes" etiqueta="ambiente" min={1} value={params.ambientes} onChange={(v) => set('ambientes', v)} invalido={Boolean(errores.ambientes)} describedBy={errores.ambientes ? 'ambientes-error' : undefined} />
                    </Campo>
                    <Campo obligatorio id="dormitorios" etiqueta="Dormitorios" error={errores.dormitorios}>
                        <Stepper id="dormitorios" etiqueta="dormitorio" min={1} value={params.dormitorios} onChange={(v) => set('dormitorios', v)} invalido={Boolean(errores.dormitorios)} describedBy={errores.dormitorios ? 'dormitorios-error' : undefined} />
                    </Campo>
                    <Campo obligatorio id="banos" etiqueta="Baños" error={errores.banos}>
                        <Stepper id="banos" etiqueta="baño" min={0} value={params.banos} onChange={(v) => set('banos', v)} invalido={Boolean(errores.banos)} describedBy={errores.banos ? 'banos-error' : undefined} />
                    </Campo>
                    <Campo id="m2" etiqueta="Superficie total">
                        <CampoConAdorno sufijo="m²">
                            <input id="m2" type="text" inputMode="decimal" value={params.m2} onChange={(e) => set('m2', e.target.value.replace(/[^\d.,]/g, ''))} placeholder="78" className={claseInputAdorno} />
                        </CampoConAdorno>
                    </Campo>
                    <Campo obligatorio id="antiguedad" etiqueta="Antigüedad" error={errores.antiguedad} ayuda="0 = a estrenar.">
                        <CampoConAdorno sufijo="años" invalido={Boolean(errores.antiguedad)}>
                            <input id="antiguedad" type="text" inputMode="numeric" value={params.antiguedad} onChange={(e) => set('antiguedad', e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="0" className={claseInputAdorno} />
                        </CampoConAdorno>
                    </Campo>
                    <CampoGrupo id="cochera-etiqueta" etiqueta="Cochera">
                        <div>
                            <PildorasMultiples opciones={[{ value: 'cochera', label: 'Tiene cochera' }]} activas={params.cochera ? ['cochera'] : []} onToggle={() => set('cochera', !params.cochera)} />
                        </div>
                    </CampoGrupo>
                </Bloque>

                <Bloque titulo="Precio y estado" ayuda={esAlquiler ? 'En alquiler, cargá el valor mensual.' : 'Precio publicado y estado comercial.'}>
                    <Campo obligatorio id="precio" etiqueta={esAlquiler ? 'Alquiler mensual' : 'Precio de venta'} error={errores.precio}>
                        <MonedaYMonto invalido={Boolean(errores.precio)} id="precio" moneda={params.moneda} onMoneda={(m) => set('moneda', m)} valor={params.precio} onValor={(v) => set('precio', v)} />
                    </Campo>
                    <Campo id="expensas" etiqueta="Expensas">
                        <MonedaYMonto id="expensas" moneda={params.moneda} valor={params.expensas} onValor={(v) => set('expensas', v)} />
                    </Campo>
                    <Campo id="estado" etiqueta="Estado comercial" obligatorio>
                        <Select id="estado" alto="lg" ariaLabel="Estado comercial" value={params.estado} onChange={(v) => set('estado', v as EstadoInmueble)} opciones={estadoInmuebleOptions.map((o) => ({ value: o.value, label: o.label }))} />
                    </Campo>
                </Bloque>

                <Bloque titulo="Propietario" ayuda="Buscalo entre tus contactos o crealo sin salir de acá." columnas={1}>
                    <Campo obligatorio id="contactoId" etiqueta="Contacto" error={errores.contactoId}>
                        <BuscadorContacto
                            id="contactoId"
                            contactos={propietarios}
                            onCrear={crearPropietario}
                            value={params.contactoId}
                            onChange={(v) => set('contactoId', v)}
                            invalido={Boolean(errores.contactoId)}
                            describedBy={errores.contactoId ? 'contactoId-error' : undefined}
                        />
                    </Campo>
                </Bloque>

                <Bloque titulo="Descripción" ultimo columnas={1}>
                    <Campo id="descripcion" etiqueta="Descripción">
                        <textarea id="descripcion" rows={4} value={params.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Estado, orientación, amenities. Ej.: apto crédito, balcón al frente" className={claseTextarea} />
                    </Campo>
                </Bloque>

                <PieFormulario>
                    <button type="button" className="btn btn-cancel h-[42px] rounded-[10px] px-[18px]" onClick={() => router.push(esEdicion ? `/inmuebles/${inmueble!.id}` : '/inmuebles')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary h-[42px] rounded-[10px] px-5 font-extrabold" disabled={guardando}>
                        {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear inmueble'}
                    </button>
                </PieFormulario>
            </FormularioTarjeta>
        </div>
    );
};

const MonedaYMonto = ({ id, moneda, onMoneda, valor, onValor, invalido = false }: { id: string; moneda: Moneda; onMoneda?: (m: Moneda) => void; valor: string; onValor: (v: string) => void; invalido?: boolean }) => (
    <div className={`flex h-[42px] overflow-hidden rounded-[9px] border ${invalido ? 'border-[1.5px] border-uk-lost dark:border-uk-lost-dark' : 'border-uk-field dark:border-uk-field-dark'} focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15 dark:focus-within:border-uk-link-dark dark:focus-within:ring-uk-link-dark/20`}>
        {onMoneda ? (
            <div role="radiogroup" aria-label="Moneda" className="flex gap-0.5 border-r border-uk-field bg-[#FBF6EE] p-1 dark:border-uk-field-dark dark:bg-gold/10">
                {monedaOptions.map((m) => (
                    <button
                        key={m.value}
                        type="button"
                        role="radio"
                        aria-checked={moneda === m.value}
                        onClick={() => onMoneda(m.value)}
                        className={`h-8 rounded-md px-2.5 text-xs text-uk-money dark:text-uk-money-dark ${moneda === m.value ? 'bg-white font-extrabold shadow-[0_1px_2px_rgba(30,15,40,.12)] dark:bg-gold/20 dark:shadow-none' : 'font-bold'}`}
                    >
                        {m.value}
                    </button>
                ))}
            </div>
        ) : (
            <span className="flex items-center border-r border-uk-field bg-[#FBF6EE] px-3 text-xs font-extrabold text-uk-money dark:border-uk-field-dark dark:bg-gold/10 dark:text-uk-money-dark">{moneda}</span>
        )}
        <input id={id} type="text" inputMode="numeric" aria-invalid={invalido || undefined} aria-describedby={invalido ? `${id}-error` : undefined} value={formatearMiles(valor)} onChange={(e) => onValor(e.target.value.replace(/\D/g, ''))} placeholder="0" className={claseInputAdorno} />
    </div>
);

export default InmuebleForm;
