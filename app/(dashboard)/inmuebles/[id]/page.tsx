import { notFound } from 'next/navigation';
import InmuebleDetalle from '@/views/Inmuebles/InmuebleDetalle';
import { getInmuebleDetalle } from '@/lib/inmueble/queries';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const detalle = await getInmuebleDetalle(id);
    if (!detalle) notFound();
    return <InmuebleDetalle detalle={detalle} />;
}
