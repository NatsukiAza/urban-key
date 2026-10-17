import MotivosPerdidaConfig from '@/views/Configuracion/MotivosPerdidaConfig';
import { getMotivosPerdidaConfig } from '@/lib/configuracion/queries';

export default async function Page() {
    const motivos = await getMotivosPerdidaConfig();
    return <MotivosPerdidaConfig motivos={motivos} />;
}
