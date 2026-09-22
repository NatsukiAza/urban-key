import type { Metadata } from 'next';
import ContactoDetalle from '@/views/Contactos/ContactoDetalle';

export const metadata: Metadata = {
    title: 'Contacto | UrbanKey',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ContactoDetalle id={id} />;
}
