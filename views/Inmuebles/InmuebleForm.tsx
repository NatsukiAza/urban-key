'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { showToast } from '@/lib/ui/toast';
import { crearInmueble, actualizarInmueble } from '@/lib/inmueble/actions';
import { tipoOperacionOptions } from '@/lib/enums/tipoOperacion';
import { tipoInmuebleOptions } from '@/lib/enums/tipoInmueble';
import { estadoInmuebleOptions } from '@/lib/enums/estadoInmueble';
import { monedaOptions } from '@/lib/enums/moneda';
import type { Inmueble, InmuebleFormOptions } from '@/lib/inmueble/types';

interface Props {
    options: InmuebleFormOptions;
    inmueble?: Inmueble | null;
}

const texto = (v: string | null | undefined) => v ?? '';
const numero = (v: number | null | undefined) => (v != null ? String(v) : '');

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
        tipoOperacion: inmueble?.tipoOperacion ?? 'VENTA',
        tipoInmueble: inmueble?.tipoInmueble ?? 'DEPARTAMENTO',
        estado: inmueble?.estado ?? 'DISPONIBLE',
        ambientes: numero(inmueble?.ambientes),
        dormitorios: numero(inmueble?.dormitorios),
        banos: numero(inmueble?.banos),
        m2: numero(inmueble?.m2),
        cochera: inmueble?.cochera ?? false,
        antiguedad: numero(inmueble?.antiguedad),
        precio: numero(inmueble?.precio),
        moneda: inmueble?.moneda ?? 'ARS',
        expensas: numero(inmueble?.expensas),
        descripcion: texto(inmueble?.descripcion),
    });
    const [guardando, setGuardando] = useState(false);

    const change = (e: any) => {
        const { id, value, type, checked } = e.target;
        setParams((p) => ({ ...p, [id]: type === 'checkbox' ? checked : value }));
    };

    const showMessage = (msg = '', type: any = 'success') => showToast(msg, type);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        // Los numéricos vacíos viajan como '' y el esquema los normaliza a null.
        const input = { ...params };
        const res = esEdicion ? await actualizarInmueble(inmueble!.id, input) : await crearInmueble(input);
        setGuardando(false);
        if (res.ok) {
            showMessage(res.mensaje);
            const destino = esEdicion ? `/inmuebles/${inmueble!.id}` : '/inmuebles';
            router.push(destino);
            router.refresh();
        } else {
            showMessage(res.mensaje, 'error');
        }
    };

    const sinPropietarios = options.propietarios.length === 0;

    return (
        <div className="panel max-w-4xl">
            <h2 className="text-xl font-semibold mb-5">{esEdicion ? 'Editar inmueble' : 'Nuevo inmueble'}</h2>

            {sinPropietarios && (
                <div className="mb-5 p-3.5 rounded text-warning bg-warning-light dark:bg-warning-dark-light">
                    No hay contactos marcados como propietarios. Cargá uno desde Contactos antes de registrar un inmueble.
                </div>
            )}

            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="sm:col-span-2 lg:col-span-3">
                    <h3 className="text-base font-semibold text-white-dark uppercase text-xs tracking-wide">Identificación</h3>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="direccion">Dirección *</label>
                    <input id="direccion" value={params.direccion} onChange={change} type="text" className="form-input" placeholder="Ej: Av. Rivadavia 18500" />
                </div>

                <div>
                    <label htmlFor="localidad">Localidad</label>
                    <input id="localidad" value={params.localidad} onChange={change} type="text" className="form-input" placeholder="Ej: Morón" />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="contactoId">Propietario *</label>
                    <select id="contactoId" value={params.contactoId} onChange={change} className="form-select" disabled={sinPropietarios}>
                        <option value="">Seleccionar…</option>
                        {options.propietarios.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombre} {c.apellido}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="nombre">Nombre interno</label>
                    <input id="nombre" value={params.nombre} onChange={change} type="text" className="form-input" placeholder="Ej: Dto. Rivadavia" />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 mt-2">
                    <h3 className="text-base font-semibold text-white-dark uppercase text-xs tracking-wide">Clasificación</h3>
                </div>

                <div>
                    <label htmlFor="tipoOperacion">Operación *</label>
                    <select id="tipoOperacion" value={params.tipoOperacion} onChange={change} className="form-select">
                        {tipoOperacionOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="tipoInmueble">Tipo de propiedad *</label>
                    <select id="tipoInmueble" value={params.tipoInmueble} onChange={change} className="form-select">
                        {tipoInmuebleOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="estado">Estado comercial *</label>
                    <select id="estado" value={params.estado} onChange={change} className="form-select">
                        {estadoInmuebleOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 mt-2">
                    <h3 className="text-base font-semibold text-white-dark uppercase text-xs tracking-wide">Características</h3>
                </div>

                <div>
                    <label htmlFor="ambientes">Ambientes</label>
                    <input id="ambientes" value={params.ambientes} onChange={change} type="number" min="1" step="1" className="form-input" placeholder="3" />
                </div>

                <div>
                    <label htmlFor="dormitorios">Dormitorios</label>
                    <input id="dormitorios" value={params.dormitorios} onChange={change} type="number" min="1" step="1" className="form-input" placeholder="2" />
                </div>

                <div>
                    <label htmlFor="banos">Baños</label>
                    <input id="banos" value={params.banos} onChange={change} type="number" min="0" step="1" className="form-input" placeholder="1" />
                </div>

                <div>
                    <label htmlFor="m2">Superficie (m²)</label>
                    <input id="m2" value={params.m2} onChange={change} type="number" min="0" step="0.01" className="form-input" placeholder="78" />
                </div>

                <div>
                    <label htmlFor="antiguedad">Antigüedad (años)</label>
                    <input id="antiguedad" value={params.antiguedad} onChange={change} type="number" min="0" step="1" className="form-input" placeholder="0 = a estrenar" />
                </div>

                <div className="flex items-end">
                    <label className="inline-flex items-center cursor-pointer mb-2">
                        <input id="cochera" type="checkbox" checked={params.cochera} onChange={change} className="form-checkbox" />
                        <span className="ltr:ml-2 rtl:mr-2">Tiene cochera</span>
                    </label>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 mt-2">
                    <h3 className="text-base font-semibold text-white-dark uppercase text-xs tracking-wide">Valores</h3>
                </div>

                <div>
                    <label htmlFor="precio">Precio</label>
                    <input id="precio" value={params.precio} onChange={change} type="number" min="0" step="0.01" className="form-input" placeholder="0" />
                </div>

                <div>
                    <label htmlFor="moneda">Moneda *</label>
                    <select id="moneda" value={params.moneda} onChange={change} className="form-select">
                        {monedaOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="expensas">Expensas</label>
                    <input id="expensas" value={params.expensas} onChange={change} type="number" min="0" step="0.01" className="form-input" placeholder="0" />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                    <label htmlFor="descripcion">Descripción</label>
                    <textarea id="descripcion" value={params.descripcion} onChange={change} className="form-textarea min-h-[100px]" placeholder="Detalle de la propiedad, estado, orientación, amenities…" />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-4 mt-2">
                    <button type="button" className="btn btn-outline-danger" onClick={() => router.push('/inmuebles')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={guardando || sinPropietarios}>
                        {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear inmueble'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InmuebleForm;
