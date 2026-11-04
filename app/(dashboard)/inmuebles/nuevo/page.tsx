import { connection } from 'next/server';
import InmuebleForm from '@/views/Inmuebles/InmuebleForm';
import { getInmuebleFormOptions } from '@/lib/inmueble/queries';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    await connection();
    const [sp, options] = await Promise.all([searchParams, getInmuebleFormOptions()]);
    const propietario = sp.contactoId ? options.propietarios.find((p) => p.id === sp.contactoId) : undefined;
    return (
        <InmuebleForm
            options={options}
            contactoIdInicial={propietario?.id}
            volverA={propietario ? `/contactos/${propietario.id}` : undefined}
        />
    );
}
