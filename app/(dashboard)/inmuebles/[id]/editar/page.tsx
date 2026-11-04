import { connection } from 'next/server';
import { notFound, redirect } from 'next/navigation';
import InmuebleForm from '@/views/Inmuebles/InmuebleForm';
import { getInmueble, getInmuebleFormOptions } from '@/lib/inmueble/queries';
import { getUsuarioActual } from '@/lib/auth/session';
import { puedeReasignar } from '@/lib/auth/permisos';
import { createClient } from '@/lib/supabase/server';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    await connection();
    const { id } = await params;
    const [inmueble, options, usuario] = await Promise.all([getInmueble(id), getInmuebleFormOptions(), getUsuarioActual()]);
    if (!inmueble) notFound();
    if (!usuario) redirect('/auth/cover-login');
    if (!puedeReasignar(usuario.rol)) {
        const supabase = await createClient();
        const { data, error } = await supabase.from('contactos').select('responsable_id').eq('id', inmueble.contactoId).maybeSingle();
        if ((error as { code?: string } | null)?.code !== '42703' && data?.responsable_id !== usuario.id) redirect('/no-autorizado');
    }
    return <InmuebleForm options={options} inmueble={inmueble} />;
}
