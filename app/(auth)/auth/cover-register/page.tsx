import type { Metadata } from 'next';
import RegisterCover from '@/views/Authentication/RegisterCover';
import { registroDisponible } from '@/lib/usuarios/actions';

export const metadata: Metadata = {
    title: 'Registro | UrbanKey',
};

export default async function Page() {
    const registroAbierto = await registroDisponible();
    return <RegisterCover registroAbierto={registroAbierto} />;
}
