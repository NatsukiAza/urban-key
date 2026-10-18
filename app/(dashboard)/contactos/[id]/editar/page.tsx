import type { Metadata } from 'next';
import ContactoEditar from '@/views/Contactos/ContactoEditar';

export const metadata: Metadata = {
    title: 'Editar contacto | UrbanKey',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ContactoEditar id={id} />;
}
