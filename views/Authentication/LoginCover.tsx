'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import Dropdown from '../../components/Dropdown';
import { IRootState } from '../../store';
import i18next from 'i18next';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';
import { createClient } from '@/lib/supabase/client';
import { limpiarCierreDeSesion } from '@/lib/supabase/sesion-dev';
import { syncUsuarioProfile } from '@/lib/supabase/usuarios';

const LoginCover = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [flag, setFlag] = useState(themeConfig.locale);
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Iniciar sesión'));
    }, [dispatch]);

    const setLocale = (nextFlag: string) => {
        setFlag(nextFlag);
        if (nextFlag.toLowerCase() === 'ae') {
            dispatch(toggleRTL('rtl'));
        } else {
            dispatch(toggleRTL('ltr'));
        }
    };

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: correo.trim(),
            password,
        });

        if (signInError) {
            setSubmitting(false);
            if (signInError.code === 'email_not_confirmed') {
                setError('Confirmá el correo antes de iniciar sesión.');
                return;
            }
            setError('Correo o contraseña incorrectos.');
            return;
        }

        const perfil = await syncUsuarioProfile(supabase);
        setSubmitting(false);
        if ('error' in perfil) {
            await supabase.auth.signOut();
            setError(perfil.error);
            return;
        }

        limpiarCierreDeSesion();
        router.push('/');
        router.refresh();
    };

    return (
        <div className="relative h-screen overflow-hidden bg-white dark:bg-[#060818]">
            <div className="absolute inset-0">
                <img src="/assets/images/auth/login-hero-2.webp" alt="" className="h-full w-full object-cover object-center" />
            </div>
            <div className="absolute top-6 right-8 z-10 hidden h-32 w-32 items-center justify-center rounded-full bg-white shadow-lg lg:flex xl:h-36 xl:w-36">
                <img src="/assets/images/auth/urbankey-logo.webp" alt="UrbanKey" className="h-24 w-24 object-contain xl:h-28 xl:w-28" />
            </div>
            <div className="relative flex h-screen items-center justify-center overflow-y-auto px-6 py-10 dark:bg-[#060818] sm:px-16 lg:justify-end lg:pe-24">
                <div className="relative flex w-full max-w-[460px] flex-col items-center justify-center gap-4 rounded-2xl bg-white/85 px-6 py-6 shadow-2xl backdrop-blur-xl dark:bg-black/60 sm:px-10 sm:py-8">
                        <div className="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:end-6 lg:top-6 lg:max-w-full">
                            <Link href="/" className="block lg:hidden">
                                <span className="text-lg font-extrabold uppercase text-primary">UrbanKey</span>
                            </Link>
                            <div className="dropdown ms-auto hidden w-max">
                                <Dropdown
                                    offset={[0, 8]}
                                    placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                    btnClassName="flex items-center gap-2.5 rounded-lg border border-white-dark/30 bg-white px-2 py-1.5 text-white-dark hover:border-primary hover:text-primary dark:bg-black"
                                    button={
                                        <>
                                            <div>
                                                <img src={`/assets/images/flags/${flag.toUpperCase()}.svg`} alt="" className="h-5 w-5 rounded-full object-cover" />
                                            </div>
                                            <div className="text-base font-bold uppercase">{flag}</div>
                                            <span className="shrink-0">
                                                <IconCaretDown />
                                            </span>
                                        </>
                                    }
                                >
                                    <ul className="!px-2 text-dark dark:text-white-dark grid grid-cols-2 gap-2 font-semibold dark:text-white-light/90 w-[280px]">
                                        {themeConfig.languageList.map((item: any) => {
                                            return (
                                                <li key={item.code}>
                                                    <button
                                                        type="button"
                                                        className={`flex w-full hover:text-primary rounded-lg ${flag === item.code ? 'bg-primary/10 text-primary' : ''}`}
                                                        onClick={() => {
                                                            i18next.changeLanguage(item.code);
                                                            setLocale(item.code);
                                                        }}
                                                    >
                                                        <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="" className="w-5 h-5 object-cover rounded-full" />
                                                        <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </Dropdown>
                            </div>
                        </div>
                        <div className="w-full max-w-[440px]">
                            <div className="mb-6">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-[#502558] md:text-4xl">Iniciar sesión</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Ingresá con tu correo y contraseña de UrbanKey</p>
                            </div>
                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="correo" className="text-[#502558]">Correo</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="correo"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="tu@correo.com"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={correo}
                                            onChange={(event) => setCorreo(event.target.value)}
                                            required
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconMail fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password" className="text-[#502558]">Contraseña</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="password"
                                            type="password"
                                            autoComplete="current-password"
                                            placeholder="Contraseña"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            required
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconLockDots fill={true} />
                                        </span>
                                    </div>
                                </div>
                                {error ? <p className="text-danger">{error}</p> : null}
                                <button type="submit" className="btn !mt-6 w-full border-0 bg-gradient-to-r from-[#502558] to-[#D8AC71] uppercase text-white shadow-[0_10px_20px_-10px_rgba(80,37,88,0.6)] transition-all duration-300 hover:from-[#D8AC71] hover:to-[#502558]" disabled={submitting}>
                                    {submitting ? 'Ingresando...' : 'Ingresar'}
                                </button>
                            </form>
                            <div className="mt-6 text-center dark:text-white">
                                ¿No tenés cuenta?&nbsp;
                                <Link href="/auth/cover-register" className="uppercase text-[#502558] underline transition hover:text-[#D8AC71] dark:hover:text-white">
                                    Registrate
                                </Link>
                            </div>
                        </div>
                        <p className="mt-4 w-full text-center text-sm dark:text-white">© {new Date().getFullYear()}. UrbanKey. Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>
    );
};

export default LoginCover;
