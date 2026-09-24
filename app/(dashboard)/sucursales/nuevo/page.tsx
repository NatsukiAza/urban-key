import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SucursalForm from '@/views/Sucursales/SucursalForm';
import { getUsuarioActual } from '@/lib/auth/session';
import { getInmobiliaria } from '@/lib/sucursal/queries';

export const metadata: Metadata = {
    title: 'Nueva sucursal | UrbanKey',
};

export default async function Page() {
    const usuario = await getUsuarioActual();
    if (usuario?.rol !== 'ADMINISTRADOR') redirect('/no-autorizado');
    const inmobiliaria = await getInmobiliaria();
    if (!inmobiliaria) redirect('/sucursales');
    return <SucursalForm />;
}
