'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { obtenerContacto, type Contacto } from '@/lib/supabase/contactos';
import ContactoForm from '@/views/Contactos/ContactoForm';
import InmuebleFormSkeleton from '@/views/Inmuebles/InmuebleFormSkeleton';

const ContactoEditar = ({ id }: { id: string }) => {
    const [contacto, setContacto] = useState<Contacto | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        obtenerContacto(createClient(), id).then((resultado) => {
            if ('error' in resultado) setError(resultado.error);
            else setContacto(resultado.contacto);
        });
    }, [id]);

    if (error) {
        return (
            <div className="panel">
                <p className="text-uk-lost dark:text-uk-lost-dark">{error}</p>
                <Link href="/contactos" className="mt-4 inline-block text-primary hover:underline dark:text-uk-link-dark">
                    Volver al listado
                </Link>
            </div>
        );
    }

    return contacto ? <ContactoForm contacto={contacto} /> : <InmuebleFormSkeleton />;
};

export default ContactoEditar;
