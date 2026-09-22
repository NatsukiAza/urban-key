import type { Metadata } from 'next';
import RegisterCover from '@/views/Authentication/RegisterCover';

export const metadata: Metadata = {
    title: 'Registro | UrbanKey',
};

export default function Page() {
    return <RegisterCover />;
}
