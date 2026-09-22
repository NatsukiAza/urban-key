import type { Metadata } from 'next';
import ContactoForm from '@/views/Contactos/ContactoForm';

export const metadata: Metadata = {
    title: 'Nuevo contacto | UrbanKey',
};

export default function Page() {
    return <ContactoForm />;
}
