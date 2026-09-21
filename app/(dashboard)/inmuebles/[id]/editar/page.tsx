import { notFound } from 'next/navigation';
import InmuebleForm from '@/views/Inmuebles/InmuebleForm';
import { getInmueble, getInmuebleFormOptions } from '@/lib/inmueble/queries';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [inmueble, options] = await Promise.all([getInmueble(id), getInmuebleFormOptions()]);
    if (!inmueble) notFound();
    return <InmuebleForm options={options} inmueble={inmueble} />;
}
