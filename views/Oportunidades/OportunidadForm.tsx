'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { showToast } from '@/lib/ui/toast';
import { crearOportunidad, actualizarOportunidad } from '@/lib/oportunidad/actions';
import type { FormOptions, Oportunidad } from '@/lib/oportunidad/types';

interface Props {
    options: FormOptions;
    oportunidad?: Oportunidad | null;
}

const OportunidadForm = ({ options, oportunidad }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const esEdicion = !!oportunidad;
    useEffect(() => {
        dispatch(setPageTitle(esEdicion ? 'Editar oportunidad' : 'Nueva oportunidad'));
    });

    const [params, setParams] = useState({
        titulo: oportunidad?.titulo ?? '',
        contactoId: oportunidad?.contactoId ?? '',
        inmuebleId: oportunidad?.inmuebleId ?? '',
        responsableId: oportunidad?.responsableId ?? '',
        funnelId: oportunidad?.funnelId ?? '',
        etapaId: oportunidad?.etapaId ?? '',
        valorEstimado: oportunidad?.valorEstimado != null ? String(oportunidad.valorEstimado) : '',
        origenId: oportunidad?.origenId ?? '',
        observaciones: oportunidad?.observaciones ?? '',
    });
    const [guardando, setGuardando] = useState(false);

    const change = (e: any) => {
        const { id, value } = e.target;
        setParams((p) => ({ ...p, [id]: value }));
    };

    // Al cambiar de funnel, reseteo la etapa.
    const onFunnelChange = (e: any) => {
        const value = e.target.value;
        setParams((p) => ({ ...p, funnelId: value, etapaId: '' }));
    };

    // En el form solo se ofrecen etapas ABIERTAS del funnel elegido (ganar/perder va por el tablero).
    const etapasDisponibles = useMemo(() => options.etapas.filter((e) => e.funnelId === params.funnelId && e.resultado === 'ABIERTA').sort((a, b) => a.orden - b.orden), [options.etapas, params.funnelId]);

    const showMessage = (msg = '', type: any = 'success') => showToast(msg, type);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        const input = {
            titulo: params.titulo,
            contactoId: params.contactoId,
            inmuebleId: params.inmuebleId || null,
            responsableId: params.responsableId,
            funnelId: params.funnelId,
            etapaId: params.etapaId,
            valorEstimado: params.valorEstimado === '' ? null : Number(params.valorEstimado),
            origenId: params.origenId || null,
            observaciones: params.observaciones || null,
        };
        const res = esEdicion ? await actualizarOportunidad(oportunidad!.id, input) : await crearOportunidad(input);
        setGuardando(false);
        if (res.ok) {
            showMessage(res.mensaje);
            const destino = esEdicion ? `/oportunidades/${oportunidad!.id}` : '/oportunidades';
            router.push(destino);
            router.refresh();
        } else {
            showMessage(res.mensaje, 'error');
        }
    };

    return (
        <div className="panel max-w-3xl">
            <h2 className="text-xl font-semibold mb-5">{esEdicion ? 'Editar oportunidad' : 'Nueva oportunidad'}</h2>
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                    <label htmlFor="titulo">Título *</label>
                    <input id="titulo" value={params.titulo} onChange={change} type="text" className="form-input" placeholder="Ej: Venta 3 amb. Morón" />
                </div>

                <div>
                    <label htmlFor="contactoId">Interesado / Contacto *</label>
                    <select id="contactoId" value={params.contactoId} onChange={change} className="form-select">
                        <option value="">Seleccionar…</option>
                        {options.interesados.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombre} {c.apellido}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="inmuebleId">Inmueble</label>
                    <select id="inmuebleId" value={params.inmuebleId} onChange={change} className="form-select">
                        <option value="">Sin inmueble</option>
                        {options.inmuebles.map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.direccion}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="responsableId">Responsable *</label>
                    <select id="responsableId" value={params.responsableId} onChange={change} className="form-select">
                        <option value="">Seleccionar…</option>
                        {options.usuarios.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.nombre} {u.apellido}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="origenId">Origen</label>
                    <select id="origenId" value={params.origenId} onChange={change} className="form-select">
                        <option value="">Sin origen</option>
                        {options.origenes.map((o) => (
                            <option key={o.id} value={o.id}>
                                {o.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="funnelId">Funnel *</label>
                    <select id="funnelId" value={params.funnelId} onChange={onFunnelChange} className="form-select">
                        <option value="">Seleccionar…</option>
                        {options.funnels.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="etapaId">Etapa inicial *</label>
                    <select id="etapaId" value={params.etapaId} onChange={change} className="form-select" disabled={!params.funnelId}>
                        <option value="">{params.funnelId ? 'Seleccionar…' : 'Elegí un funnel primero'}</option>
                        {etapasDisponibles.map((e) => (
                            <option key={e.id} value={e.id}>
                                {e.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="valorEstimado">Valor estimado</label>
                    <input id="valorEstimado" value={params.valorEstimado} onChange={change} type="number" min="0" className="form-input" placeholder="0" />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="observaciones">Observaciones</label>
                    <textarea id="observaciones" value={params.observaciones} onChange={change} className="form-textarea min-h-[100px]" placeholder="Notas de la oportunidad" />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-4 mt-2">
                    <button type="button" className="btn btn-outline-danger" onClick={() => router.push('/oportunidades')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                        {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear oportunidad'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OportunidadForm;
