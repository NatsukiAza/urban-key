import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Sin acceso | UrbanKey',
};

export default function Page() {
    return (
        <div className="panel">
            <h1 className="mb-3 text-lg font-semibold dark:text-white-light">No tenés acceso a esta pantalla</h1>
            <p className="mb-5 text-white-dark">La gestión de usuarios es solo para el administrador.</p>
            <Link href="/" className="btn btn-primary">
                Volver al inicio
            </Link>
        </div>
    );
}
