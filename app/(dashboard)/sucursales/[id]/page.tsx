import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SucursalDetalleView from '@/views/Sucursales/SucursalDetalle';
import { getUsuarioActual } from '@/lib/auth/session';
import { getSucursal, getUsuariosParaAsignar } from '@/lib/sucursal/queries';

export const metadata: Metadata = {
    title: 'Sucursal | UrbanKey',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const usuario = await getUsuarioActual();
    const esAdmin = usuario?.rol === 'ADMINISTRADOR';
    const [detalle, candidatos] = await Promise.all([getSucursal(id), esAdmin ? getUsuariosParaAsignar() : Promise.resolve([])]);
    if (!detalle) notFound();
    return <SucursalDetalleView detalle={detalle} esAdmin={esAdmin} candidatos={candidatos} />;
}
