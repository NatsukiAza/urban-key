'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { listarContextoContacto, obtenerContacto, type Contacto, type ContextoContacto } from '@/lib/supabase/contactos';
import { puedeReasignar } from '@/lib/auth/permisos';
import ContactoForm from '@/views/Contactos/ContactoForm';
import InmuebleFormSkeleton from '@/views/Inmuebles/InmuebleFormSkeleton';

const ContactoEditar = ({ id }: { id: string }) => {
    const [contacto, setContacto] = useState<Contacto | null>(null);
    const [ctx, setCtx] = useState<ContextoContacto | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const supabase = createClient();
        Promise.all([obtenerContacto(supabase, id), listarContextoContacto(supabase)]).then(([resultado, contexto]) => {
            if ('error' in resultado) setError(resultado.error);
            else setContacto(resultado.contacto);
            setCtx(contexto);
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

    const ajeno = Boolean(contacto && ctx?.yo && !puedeReasignar(ctx.yo.rol) && contacto.responsable_id !== ctx.yo.id);
    if (ajeno) {
        return (
            <div className="panel">
                <p className="text-uk-ink dark:text-uk-ink-dark">Este contacto está asignado a otra persona. Podés verlo, pero no modificarlo.</p>
                <Link href={`/contactos/${id}`} className="mt-4 inline-block text-primary hover:underline dark:text-uk-link-dark">
                    Volver al detalle
                </Link>
            </div>
        );
    }

    return contacto ? <ContactoForm contacto={contacto} /> : <InmuebleFormSkeleton />;
};

export default ContactoEditar;
