import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import InmuebleDetalle from '@/views/Inmuebles/InmuebleDetalle';
import { getInmuebleDetalle } from '@/lib/inmueble/queries';
import { getUsuarioActual } from '@/lib/auth/session';
import { puedeReasignar } from '@/lib/auth/permisos';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    await connection();
    const { id } = await params;
    const [detalle, usuario] = await Promise.all([getInmuebleDetalle(id), getUsuarioActual()]);
    if (!detalle) notFound();
    const puedeEditar = Boolean(usuario && (puedeReasignar(usuario.rol) || detalle.propietario?.responsableId === usuario.id));
    return <InmuebleDetalle detalle={detalle} puedeEditar={puedeEditar} />;
}
