import InmuebleForm from '@/views/Inmuebles/InmuebleForm';
import { getInmuebleFormOptions } from '@/lib/inmueble/queries';

export default async function Page() {
    const options = await getInmuebleFormOptions();
    return <InmuebleForm options={options} />;
}
