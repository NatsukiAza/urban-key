import OportunidadForm from '@/views/Oportunidades/OportunidadForm';
import { getFormOptions } from '@/lib/oportunidad/queries';

export default async function Page() {
    const options = await getFormOptions();
    return <OportunidadForm options={options} />;
}
