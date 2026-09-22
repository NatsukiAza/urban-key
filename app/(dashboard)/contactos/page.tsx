import type { Metadata } from 'next';
import ContactosList from '@/views/Contactos/ContactosList';

export const metadata: Metadata = {
    title: 'Contactos | UrbanKey',
};

export default function Page() {
    return <ContactosList />;
}
