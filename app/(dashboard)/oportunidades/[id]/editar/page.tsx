import { notFound } from 'next/navigation';
import OportunidadForm from '@/views/Oportunidades/OportunidadForm';
import { getOportunidad, getFormOptions } from '@/lib/oportunidad/queries';
import { getUsuarioActual } from '@/lib/auth/session';
import { puedeReasignar } from '@/lib/auth/permisos';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [oportunidad, options, usuario] = await Promise.all([getOportunidad(id), getFormOptions(), getUsuarioActual()]);
    if (!oportunidad) notFound();
    return (
        <OportunidadForm
            options={options}
            oportunidad={oportunidad}
            funnelNombre={options.funnels.find((f) => f.id === oportunidad.funnelId)?.nombre}
            usuarioActualId={usuario?.id}
            puedeReasignar={puedeReasignar(usuario?.rol)}
        />
    );
}
