'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import IconPin from '../Icon/IconPin';
import IconCaretDown from '../Icon/IconCaretDown';
import IconHome from '../Icon/IconHome';
import IconUsers from '../Icon/IconUsers';
import IconUser from '../Icon/IconUser';
import IconTrendingUp from '../Icon/IconTrendingUp';
import IconMapPin from '../Icon/IconMapPin';
import IconSettings from '../Icon/IconSettings';
import { createClient } from '@/lib/supabase/client';
import type { RolUsuario } from '@/lib/enums/rolUsuario';

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [rol, setRol] = useState<RolUsuario | null>(null);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const pathname = usePathname();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data }) => {
            if (!data.user) return;
            const { data: row } = await supabase.from('usuarios').select('rol').eq('id', data.user.id).maybeSingle();
            if (row) setRol(row.rol);
        });
    }, []);

    const enSeccion = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
    const enTablero = enSeccion('/oportunidades/tablero');
    const activo = {
        inmuebles: enSeccion('/inmuebles'),
        sucursales: enSeccion('/sucursales'),
        contactos: enSeccion('/contactos'),
        oportunidades: enSeccion('/oportunidades'),
        usuarios: enSeccion('/usuarios'),
        configuracion: enSeccion('/configuracion'),
    };
    const seccionActual = activo.oportunidades ? 'oportunidades' : activo.configuracion ? 'configuracion' : '';
    const props = (esActivo: boolean) => ({ 'aria-current': esActivo ? ('page' as const) : undefined, className: esActivo ? 'active' : '' });

    useEffect(() => {
        setCurrentMenu(seccionActual);
    }, [seccionActual]);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-uk-muted dark:text-uk-muted-dark' : ''}`}
            >
                <div className="h-full bg-white dark:bg-black bg-cover bg-center bg-no-repeat bg-[url('/assets/images/sidebar-bg.webp')] dark:bg-[url('/assets/images/sidebar-bg-dark.webp')]">
                    <div className="sidebar-header relative flex justify-between items-center px-4 py-3">
                        <Link href="/" className="main-logo flex items-center shrink-0">
                            <span className="logo-mini hidden text-2xl font-semibold align-middle text-white drop-shadow">U</span>
                            <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle text-white drop-shadow">UrbanKey</span>
                        </Link>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 transition duration-300"
                            onClick={() => dispatch(toggleSidebar())}
                            title={themeConfig.sidebar ? 'Desfijar menú' : 'Fijar menú'}
                        >
                            <IconPin className="m-auto text-white drop-shadow" fill={themeConfig.sidebar} />
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative z-10 font-semibold space-y-0.5 px-[13px] py-0">
                            {/* La cartera de inmuebles es el insumo del embudo: va antes que Oportunidades. */}
                            <li className="nav-item">
                                <Link href="/inmuebles" className={`group ${activo.inmuebles ? 'active' : ''}`} aria-current={activo.inmuebles ? 'page' : undefined}>
                                    <div className="flex items-center">
                                        <IconHome duotone={false} className="text-white group-hover:!text-white shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-uk-sidebar-text group-hover:text-white">{t('Inmuebles')}</span>
                                    </div>
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link href="/sucursales" className={`group ${activo.sucursales ? 'active' : ''}`} aria-current={activo.sucursales ? 'page' : undefined}>
                                    <div className="flex items-center">
                                        <IconMapPin duotone={false} className="text-white group-hover:!text-white shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-uk-sidebar-text group-hover:text-white">{rol && rol !== 'ADMINISTRADOR' ? t('Sucursal') : t('Sucursales')}</span>
                                    </div>
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link href="/contactos" className={`group ${activo.contactos ? 'active' : ''}`} aria-current={activo.contactos ? 'page' : undefined}>
                                    <div className="flex items-center">
                                        <IconUsers duotone={false} className="text-white group-hover:!text-white shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-uk-sidebar-text group-hover:text-white">{t('Contactos')}</span>
                                    </div>
                                </Link>
                            </li>

                            <li className="menu nav-item">
                                <button type="button" className={`${activo.oportunidades ? 'active' : ''} nav-link group w-full`} aria-current={activo.oportunidades ? 'page' : undefined} onClick={() => toggleMenu('oportunidades')}>
                                    <div className="flex items-center">
                                        <IconTrendingUp duotone={false} className="text-white group-hover:!text-white shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-uk-sidebar-text group-hover:text-white">{t('Oportunidades')}</span>
                                    </div>

                                    <div className={`text-white ${currentMenu !== 'oportunidades' ? 'rtl:rotate-90 -rotate-90' : ''}`}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'oportunidades' ? 'auto' : 0}>
                                    <ul className="sub-menu">
                                        <li>
                                            <Link {...props(activo.oportunidades && !enTablero)} href="/oportunidades">{t('Lista')}</Link>
                                        </li>
                                        <li>
                                            <Link {...props(enTablero)} href="/oportunidades/tablero">{t('Tablero')}</Link>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {rol === 'ADMINISTRADOR' ? (
                                <li className="nav-item">
                                    <Link href="/usuarios" className={`group ${activo.usuarios ? 'active' : ''}`} aria-current={activo.usuarios ? 'page' : undefined}>
                                        <div className="flex items-center">
                                            <IconUser duotone={false} className="text-white group-hover:!text-white shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-uk-sidebar-text group-hover:text-white">{t('Usuarios')}</span>
                                        </div>
                                    </Link>
                                </li>
                            ) : null}

                            {rol === 'ADMINISTRADOR' ? (
                                <li className="menu nav-item">
                                    <button type="button" className={`${activo.configuracion ? 'active' : ''} nav-link group w-full`} aria-current={activo.configuracion ? 'page' : undefined} onClick={() => toggleMenu('configuracion')}>
                                        <div className="flex items-center">
                                            <IconSettings className="text-uk-sidebar-text group-hover:!text-white shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-uk-sidebar-text group-hover:text-white">{t('Configuración')}</span>
                                        </div>

                                        <div className={`text-white ${currentMenu !== 'configuracion' ? 'rtl:rotate-90 -rotate-90' : ''}`}>
                                            <IconCaretDown />
                                        </div>
                                    </button>

                                    <AnimateHeight duration={300} height={currentMenu === 'configuracion' ? 'auto' : 0}>
                                        <ul className="sub-menu">
                                            <li>
                                                <Link {...props(enSeccion('/configuracion/embudos'))} href="/configuracion/embudos">{t('Embudos')}</Link>
                                            </li>
                                            <li>
                                                <Link {...props(enSeccion('/configuracion/motivos-perdida'))} href="/configuracion/motivos-perdida">{t('Motivos de pérdida')}</Link>
                                            </li>
                                            <li>
                                                <Link {...props(enSeccion('/configuracion/tipos-actividad'))} href="/configuracion/tipos-actividad">{t('Tipos de actividad')}</Link>
                                            </li>
                                            <li>
                                                <Link {...props(enSeccion('/configuracion/origenes'))} href="/configuracion/origenes">{t('Orígenes')}</Link>
                                            </li>
                                        </ul>
                                    </AnimateHeight>
                                </li>
                            ) : null}
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
