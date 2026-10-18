import { connection } from 'next/server';
import MotivosPerdidaConfig from '@/views/Configuracion/MotivosPerdidaConfig';
import { getMotivosPerdidaConfig } from '@/lib/configuracion/queries';

export default async function Page() {
    await connection();
    const { motivos, error } = await getMotivosPerdidaConfig();
    return <MotivosPerdidaConfig motivos={motivos} hayError={error} />;
}
