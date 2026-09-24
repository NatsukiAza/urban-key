import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import SucursalForm from '@/views/Sucursales/SucursalForm';
import { getUsuarioActual } from '@/lib/auth/session';
import { getSucursal } from '@/lib/sucursal/queries';

export const metadata: Metadata = {
    title: 'Editar sucursal | UrbanKey',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const usuario = await getUsuarioActual();
    if (usuario?.rol !== 'ADMINISTRADOR') redirect('/no-autorizado');
    const detalle = await getSucursal(id);
    if (!detalle) notFound();
    return <SucursalForm sucursal={detalle} />;
}
