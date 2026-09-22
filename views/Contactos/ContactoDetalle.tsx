'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { createClient } from '@/lib/supabase/client';
import {
    ESTADOS_CONTACTO,
    actualizarEstadoContacto,
    agregarObservacion,
    estadoLabel,
    listarObservaciones,
    nombreContacto,
    obtenerContacto,
    type Contacto,
    type EstadoContacto,
    type Observacion,
} from '@/lib/supabase/contactos';

const ContactoDetalle = ({ id }: { id: string }) => {
    const dispatch = useDispatch();
    const [contacto, setContacto] = useState<Contacto | null>(null);
    const [estado, setEstado] = useState<EstadoContacto>('POTENCIAL');
    const [observaciones, setObservaciones] = useState<Observacion[]>([]);
    const [texto, setTexto] = useState('');
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardandoEstado, setGuardandoEstado] = useState(false);
    const [guardandoNota, setGuardandoNota] = useState(false);

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

        const notasResultado = await listarObservaciones(supabase, id);
        setContacto(contactoResultado.contacto);
        setEstado(contactoResultado.contacto.estado);
        dispatch(setPageTitle(nombreContacto(contactoResultado.contacto)));
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

    const guardarEstado = async () => {
        if (!contacto || estado === contacto.estado) {
            return;
        }
        setAviso('');
        setError('');
        setGuardandoEstado(true);
        const resultado = await actualizarEstadoContacto(createClient(), contacto.id, estado);
        setGuardandoEstado(false);
        if ('error' in resultado) {
            setError(resultado.error);
            return;
        }
        setContacto(resultado.contacto);
        setAviso('Estado actualizado.');
    };

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
        setAviso('');
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

    if (cargando) {
        return <p className="text-white-dark">Cargando contacto...</p>;
    }

    if (!contacto) {
        return (
            <div className="panel">
                <p className="text-danger">{error || 'No encontramos ese contacto.'}</p>
                <Link href="/contactos" className="mt-4 inline-block text-primary hover:underline">
                    Volver al listado
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="panel">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-lg font-semibold dark:text-white-light">{nombreContacto(contacto)}</h1>
                    <Link href="/contactos" className="text-primary hover:underline">
                        Volver al listado
                    </Link>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-white-dark">Email</dt>
                        <dd>{contacto.email || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-white-dark">Teléfono</dt>
                        <dd>{contacto.telefono || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-white-dark">Propietario</dt>
                        <dd>{contacto.es_propietario ? 'Sí' : 'No'}</dd>
                    </div>
                    <div>
                        <dt className="text-white-dark">Interesado</dt>
                        <dd>{contacto.es_interesado ? 'Sí' : 'No'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-white-dark">Nota del contacto</dt>
                        <dd>{contacto.observaciones || '—'}</dd>
                    </div>
                </dl>
                <div className="mt-5 flex flex-wrap items-end gap-3">
                    <div>
                        <label htmlFor="estado">Estado</label>
                        <select id="estado" className="form-select" value={estado} onChange={(event) => setEstado(event.target.value as EstadoContacto)}>
                            {ESTADOS_CONTACTO.map((item) => (
                                <option key={item} value={item}>
                                    {estadoLabel[item]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={guardarEstado} disabled={guardandoEstado || estado === contacto.estado}>
                        {guardandoEstado ? 'Guardando...' : 'Actualizar estado'}
                    </button>
                </div>
            </div>

            <div className="panel">
                <h2 className="mb-5 text-lg font-semibold dark:text-white-light">Observaciones</h2>
                <form className="mb-5 space-y-3" onSubmit={guardarObservacion}>
                    <label htmlFor="observacion">Nueva observación</label>
                    <textarea id="observacion" className="form-textarea" rows={3} value={texto} onChange={(event) => setTexto(event.target.value)} />
                    <button type="submit" className="btn btn-primary" disabled={guardandoNota}>
                        {guardandoNota ? 'Guardando...' : 'Agregar observación'}
                    </button>
                </form>
                {error ? <p className="mb-4 text-danger">{error}</p> : null}
                {aviso ? <p className="mb-4 text-success">{aviso}</p> : null}
                {observaciones.length === 0 ? <p className="text-white-dark">Todavía no hay observaciones.</p> : null}
                <ul className="space-y-4">
                    {observaciones.map((item) => (
                        <li key={item.id} className="border-b border-white-light pb-4 dark:border-white-light/10">
                            <p>{item.descripcion}</p>
                            <p className="mt-1 text-xs text-white-dark">
                                {item.autor} · {new Date(item.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ContactoDetalle;
