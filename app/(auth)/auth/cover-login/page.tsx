import type { Metadata } from 'next';
import LoginCover from '@/views/Authentication/LoginCover';

export const metadata: Metadata = {
    title: 'Iniciar sesión | UrbanKey',
};

export default function Page() {
    return <LoginCover />;
}
