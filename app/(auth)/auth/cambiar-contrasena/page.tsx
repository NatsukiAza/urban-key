import type { Metadata } from 'next';
import CambiarContrasenaCover from '@/views/Authentication/CambiarContrasenaCover';

export const metadata: Metadata = {
    title: 'Cambiar contraseña | UrbanKey',
};

export default function Page() {
    return <CambiarContrasenaCover />;
}
