import { redirect } from 'next/navigation';
import { getUsuarioActual } from '@/lib/auth/session';

export default async function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
    const usuario = await getUsuarioActual();
    if (usuario?.rol !== 'ADMINISTRADOR') redirect('/no-autorizado');
    return children;
}
