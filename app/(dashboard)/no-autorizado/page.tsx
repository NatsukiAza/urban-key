import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Sin acceso | UrbanKey',
};

export default function Page() {
    return (
        <div className="panel max-w-xl">
            <h2 className="text-xl font-semibold mb-2">No tenés permiso para ver esta pantalla</h2>
            <p className="text-white-dark mb-5">Esta acción está reservada al administrador.</p>
            <Link href="/" className="btn btn-primary">
                Volver al inicio
            </Link>
        </div>
    );
}
