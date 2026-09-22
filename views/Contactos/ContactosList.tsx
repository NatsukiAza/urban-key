'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { createClient } from '@/lib/supabase/client';
import { estadoLabel, listarContactos, type Contacto } from '@/lib/supabase/contactos';

const ContactosList = () => {
    const dispatch = useDispatch();
    const [contactos, setContactos] = useState<Contacto[]>([]);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Contactos'));
    }, [dispatch]);

    useEffect(() => {
        const supabase = createClient();
        listarContactos(supabase).then((resultado) => {
            if ('error' in resultado) {
                setError(resultado.error);
            } else {
                setContactos(resultado.contactos);
            }
            setCargando(false);
        });
    }, []);

    return (
        <div className="panel">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-lg font-semibold dark:text-white-light">Contactos</h1>
                <Link href="/contactos/nuevo" className="btn btn-primary">
                    Nuevo contacto
                </Link>
            </div>
            {error ? <p className="text-danger">{error}</p> : null}
            {cargando ? <p className="text-white-dark">Cargando contactos...</p> : null}
            {!cargando && !error && contactos.length === 0 ? <p className="text-white-dark">Todavía no hay contactos.</p> : null}
            {contactos.length > 0 ? (
                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contactos.map((contacto) => (
                                <tr key={contacto.id}>
                                    <td>
                                        <Link href={`/contactos/${contacto.id}`} className="font-semibold text-primary hover:underline">
                                            {contacto.nombre}
                                        </Link>
                                    </td>
                                    <td>{contacto.apellido}</td>
                                    <td>{contacto.email || '—'}</td>
                                    <td>{contacto.telefono || '—'}</td>
                                    <td>{estadoLabel[contacto.estado]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
};

export default ContactosList;
