import MotivosPerdidaConfig from '@/views/Configuracion/MotivosPerdidaConfig';
import { getMotivosPerdidaConfig } from '@/lib/configuracion/queries';

export default async function Page() {
    const { motivos, error } = await getMotivosPerdidaConfig();
    return <MotivosPerdidaConfig motivos={motivos} hayError={error} />;
}
