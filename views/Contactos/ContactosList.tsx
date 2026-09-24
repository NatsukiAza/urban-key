'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { createClient } from '@/lib/supabase/client';
import { estadoContactoConfig, listarContactos, type Contacto } from '@/lib/supabase/contactos';
import PageHeader, { contar } from '@/components/ui/PageHeader';
import Iniciales from '@/components/ui/Iniciales';
import IconPlus from '@/components/Icon/IconPlus';

const ContactosList = () => {
    const dispatch = useDispatch();
    const [contactos, setContactos] = useState<Contacto[]>([]);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');

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

    const visibles = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return contactos;
        return contactos.filter((contacto) => {
            const texto = `${contacto.nombre} ${contacto.apellido} ${contacto.email ?? ''} ${contacto.telefono ?? ''}`.toLowerCase();
            return texto.includes(q);
        });
    }, [busqueda, contactos]);

    return (
        <div>
            <PageHeader
                title="Contactos"
                description={cargando ? 'Cargando...' : contar(contactos.length, 'contacto', 'contactos')}
                actions={
                    <Link href="/contactos/nuevo" className="btn btn-primary gap-2">
                        <IconPlus />
                        Nuevo contacto
                    </Link>
                }
            />
            <div className="panel px-0">
                <div className="mb-4 border-b border-white-light px-5 pb-4 dark:border-[#1b2e4b]">
                    <input type="text" className="form-input w-full sm:w-56" placeholder="Buscar..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
                </div>
                {error ? <p className="px-5 text-danger">{error}</p> : null}
                {cargando ? <p className="px-5 pb-5 text-white-dark">Cargando contactos...</p> : null}
                {!cargando && !error && contactos.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <p className="text-white-dark">Todavía no hay contactos.</p>
                        <Link href="/contactos/nuevo" className="btn btn-primary mt-4 inline-flex">
                            Nuevo contacto
                        </Link>
                    </div>
                ) : null}
                {!cargando && contactos.length > 0 && visibles.length === 0 ? <p className="px-5 pb-5 text-white-dark">Ningún contacto coincide con la búsqueda.</p> : null}
                {visibles.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Teléfono</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibles.map((contacto) => (
                                    <tr key={contacto.id}>
                                        <td>
                                            <Link href={`/contactos/${contacto.id}`} className="flex items-center gap-3">
                                                <Iniciales nombre={contacto.nombre} apellido={contacto.apellido} />
                                                <span className="font-semibold text-primary">
                                                    {contacto.nombre} {contacto.apellido}
                                                </span>
                                            </Link>
                                        </td>
                                        <td>{contacto.email || '—'}</td>
                                        <td>{contacto.telefono || '—'}</td>
                                        <td>
                                            <span className={`badge badge-outline-${estadoContactoConfig[contacto.estado].color}`}>{estadoContactoConfig[contacto.estado].label}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ContactosList;
