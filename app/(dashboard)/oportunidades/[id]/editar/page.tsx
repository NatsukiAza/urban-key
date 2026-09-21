import { notFound } from 'next/navigation';
import OportunidadForm from '@/views/Oportunidades/OportunidadForm';
import { getOportunidad, getFormOptions } from '@/lib/oportunidad/queries';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [oportunidad, options] = await Promise.all([getOportunidad(id), getFormOptions()]);
    if (!oportunidad) notFound();
    return <OportunidadForm options={options} oportunidad={oportunidad} />;
}
