'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { createClient } from '@/lib/supabase/client';
import {
    agregarObservacion,
    listarObservaciones,
    nombreContacto,
    obtenerContacto,
    type Contacto,
    type Observacion,
} from '@/lib/supabase/contactos';
import DetailHero from '@/components/ui/DetailHero';
import Timeline from '@/components/ui/Timeline';

const ContactoDetalle = ({ id }: { id: string }) => {
    const dispatch = useDispatch();
    const [contacto, setContacto] = useState<Contacto | null>(null);
    const [observaciones, setObservaciones] = useState<Observacion[]>([]);
    const [texto, setTexto] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
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

    const roles = [contacto.es_propietario ? 'Propietario' : null, contacto.es_interesado ? 'Interesado' : null].filter(Boolean).join(' · ') || '—';

    return (
        <div className="space-y-5">
            <DetailHero
                title={nombreContacto(contacto)}
                actions={
                    <Link href="/contactos" className="btn btn-outline-primary">
                        Volver
                    </Link>
                }
                facts={[
                    { label: 'Email', value: contacto.email || '—' },
                    { label: 'Teléfono', value: contacto.telefono || '—' },
                    { label: 'Rol', value: roles },
                ]}
            />
            <div className="panel">
                <h2 className="mb-4 text-lg font-semibold">Datos</h2>
                <p className="text-white-dark">{contacto.observaciones || 'Sin nota del contacto.'}</p>
            </div>

            <div className="panel">
                <h2 className="mb-5 text-lg font-semibold">Observaciones</h2>
                <form className="mb-5 space-y-3" onSubmit={guardarObservacion}>
                    <label htmlFor="observacion">Nueva observación</label>
                    <textarea id="observacion" className="form-textarea" rows={3} value={texto} onChange={(event) => setTexto(event.target.value)} />
                    <button type="submit" className="btn btn-primary" disabled={guardandoNota}>
                        {guardandoNota ? 'Guardando...' : 'Agregar observación'}
                    </button>
                </form>
                {error ? <p className="mb-4 text-danger">{error}</p> : null}
                <Timeline
                    vacio="Todavía no hay observaciones."
                    items={observaciones.map((item) => ({
                        id: item.id,
                        title: item.descripcion || '—',
                        meta: `${item.autor} · ${new Date(item.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}`,
                    }))}
                />
            </div>
        </div>
    );
};

export default ContactoDetalle;
