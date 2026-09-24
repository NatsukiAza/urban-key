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
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconCaretDown from '../Icon/IconCaretDown';
import IconHome from '../Icon/IconHome';
import IconUsers from '../Icon/IconUsers';
import IconUser from '../Icon/IconUser';
import IconTrendingUp from '../Icon/IconTrendingUp';
import IconMapPin from '../Icon/IconMapPin';
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

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <Link href="/" className="main-logo flex items-center shrink-0">
                            <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle text-primary dark:text-white-light">UrbanKey</span>
                        </Link>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            {/* La cartera de inmuebles es el insumo del embudo: va antes que Oportunidades. */}
                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'inmuebles' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('inmuebles')}>
                                    <div className="flex items-center">
                                        <IconHome className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Inmuebles')}</span>
                                    </div>

                                    <div className={currentMenu !== 'inmuebles' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'inmuebles' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <Link href="/inmuebles">{t('Lista')}</Link>
                                        </li>
                                        <li>
                                            <Link href="/inmuebles/nuevo">{t('Nuevo')}</Link>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            <li className="nav-item">
                                <Link href="/sucursales" className="group">
                                    <div className="flex items-center">
                                        <IconMapPin className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Sucursales')}</span>
                                    </div>
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link href="/contactos" className="group">
                                    <div className="flex items-center">
                                        <IconUsers className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Contactos')}</span>
                                    </div>
                                </Link>
                            </li>

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'oportunidades' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('oportunidades')}>
                                    <div className="flex items-center">
                                        <IconTrendingUp className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Oportunidades')}</span>
                                    </div>

                                    <div className={currentMenu !== 'oportunidades' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'oportunidades' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <Link href="/oportunidades">{t('Lista')}</Link>
                                        </li>
                                        <li>
                                            <Link href="/oportunidades/tablero">{t('Tablero')}</Link>
                                        </li>
                                        <li>
                                            <Link href="/oportunidades/nuevo">{t('Nueva')}</Link>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {rol === 'ADMINISTRADOR' ? (
                                <li className="nav-item">
                                    <Link href="/usuarios" className="group">
                                        <div className="flex items-center">
                                            <IconUser className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Usuarios')}</span>
                                        </div>
                                    </Link>
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
