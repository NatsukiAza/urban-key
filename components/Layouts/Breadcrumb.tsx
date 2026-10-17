'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { IRootState } from '@/store';

const secciones: Record<string, { label: string; subsecciones?: Record<string, string> }> = {
    inmuebles: { label: 'Inmuebles' },
    oportunidades: { label: 'Oportunidades', subsecciones: { tablero: 'Tablero' } },
    contactos: { label: 'Contactos' },
    sucursales: { label: 'Sucursales' },
    usuarios: { label: 'Usuarios' },
};

type Migaja = { label: string; href: string };

const construir = (pathname: string, detalle: { padre: string; titulo: string }): Migaja[] => {
    const [seccion, segundo, tercero] = pathname.split('/').filter(Boolean);
    const config = secciones[seccion];
    if (!config) return [];
    const base = `/${seccion}`;
    const migajas: Migaja[] = [{ label: config.label, href: base }];

    if (segundo === 'nuevo') {
        migajas.push({ label: 'Lista', href: base }, { label: 'Nuevo', href: pathname });
    } else if (segundo && tercero === 'editar') {
        migajas.push({ label: 'Lista', href: base }, { label: 'Editar', href: pathname });
    } else if (segundo && !config.subsecciones?.[segundo]) {
        if (detalle.padre) migajas.push({ label: detalle.padre, href: base });
        migajas.push({ label: detalle.titulo || 'Detalle', href: pathname });
    } else {
        return [];
    }
    return migajas;
};

const Breadcrumb = () => {
    const detalle = useSelector((state: IRootState) => state.themeConfig.breadcrumbDetalle);
    const migajas = construir(usePathname(), detalle);
    if (!migajas.length) return null;

    return (
        <nav aria-label="Ruta de navegación" className="hidden min-w-0 lg:block">
            <ol className="flex items-center gap-2 text-[13px] text-uk-muted dark:text-uk-muted-dark">
                {migajas.map((migaja, i) => {
                    const ultima = i === migajas.length - 1;
                    return (
                        <li key={`${migaja.href}-${migaja.label}`} className="flex items-center gap-2">
                            {i > 0 ? <span aria-hidden="true">/</span> : null}
                            {ultima ? (
                                <span aria-current="page" className="font-bold text-uk-ink dark:text-uk-ink-dark">
                                    {migaja.label}
                                </span>
                            ) : (
                                <Link href={migaja.href} className="hover:text-uk-ink hover:underline dark:hover:text-uk-ink-dark">
                                    {migaja.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
