import { connection } from 'next/server';
import type { Metadata } from 'next';
import SucursalesList from '@/views/Sucursales/SucursalesList';
import { getUsuarioActual } from '@/lib/auth/session';
import { getInmobiliaria, getSucursales } from '@/lib/sucursal/queries';

export const metadata: Metadata = {
    title: 'Sucursales | UrbanKey',
};

export default async function Page() {
    await connection();
    const [usuario, inmobiliaria, sucursales] = await Promise.all([getUsuarioActual(), getInmobiliaria(), getSucursales()]);
    return <SucursalesList inmobiliaria={inmobiliaria} sucursales={sucursales} esAdmin={usuario?.rol === 'ADMINISTRADOR'} />;
}
