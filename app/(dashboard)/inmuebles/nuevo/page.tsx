import { connection } from 'next/server';
import InmuebleForm from '@/views/Inmuebles/InmuebleForm';
import { getInmuebleFormOptions } from '@/lib/inmueble/queries';

export default async function Page() {
    await connection();
    const options = await getInmuebleFormOptions();
    return <InmuebleForm options={options} />;
}
