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
import IconUser from '../../components/Icon/IconUser';
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';
import { createClient } from '@/lib/supabase/client';
import { syncUsuarioProfile } from '@/lib/supabase/usuarios';

const RegisterCover = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [flag, setFlag] = useState(themeConfig.locale);
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Registro'));
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
        setNotice('');

        const nombreLimpio = nombre.trim();
        const apellidoLimpio = apellido.trim();
        if (!nombreLimpio || !apellidoLimpio) {
            setError('Nombre y apellido son obligatorios.');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña tiene que tener al menos 6 caracteres.');
            return;
        }

        setSubmitting(true);
        const supabase = createClient();
        const { data, error: signUpError } = await supabase.auth.signUp({
            email: correo.trim(),
            password,
            options: {
                data: {
                    nombre: nombreLimpio,
                    apellido: apellidoLimpio,
                },
            },
        });

        if (signUpError) {
            setSubmitting(false);
            const alreadyExists = signUpError.code === 'user_already_exists' || signUpError.message.toLowerCase().includes('already');
            setError(alreadyExists ? 'Ya existe una cuenta con ese correo.' : 'No se pudo crear la cuenta. Revisá los datos e intentá de nuevo.');
            return;
        }

        if (data.user && data.user.identities && data.user.identities.length === 0) {
            setSubmitting(false);
            setError('Ya existe una cuenta con ese correo.');
            return;
        }

        if (!data.session) {
            setSubmitting(false);
            setNotice('Te enviamos un correo para confirmar la cuenta. Cuando lo confirmes, iniciá sesión. El perfil queda en usuarios.');
            return;
        }

        const perfil = await syncUsuarioProfile(supabase);
        setSubmitting(false);
        if ('error' in perfil) {
            await supabase.auth.signOut();
            setError(perfil.error);
            return;
        }

        router.push('/');
        router.refresh();
    };

    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="" className="h-full w-full object-cover" />
            </div>
            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <img src="/assets/images/auth/coming-soon-object1.png" alt="" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
                <img src="/assets/images/auth/coming-soon-object2.png" alt="" className="absolute left-24 top-0 h-40 md:left-[30%]" />
                <img src="/assets/images/auth/coming-soon-object3.png" alt="" className="absolute right-0 top-0 h-[300px]" />
                <img src="/assets/images/auth/polygon-object.svg" alt="" className="absolute bottom-0 end-[28%]" />
                <div className="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0">
                    <div className="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,rgba(239,18,98,1)_0%,rgba(67,97,238,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]">
                        <div className="absolute inset-y-0 w-8 from-primary/10 via-transparent to-transparent ltr:-right-10 ltr:bg-gradient-to-r rtl:-left-10 rtl:bg-gradient-to-l xl:w-16 ltr:xl:-right-20 rtl:xl:-left-20"></div>
                        <div className="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg]">
                            <Link href="/" className="w-48 block lg:w-72 ms-10">
                                <img src="/assets/images/auth/logo-white.svg" alt="UrbanKey" className="w-full" />
                            </Link>
                            <div className="mt-24 hidden w-full max-w-[430px] lg:block">
                                <img src="/assets/images/auth/register.svg" alt="" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:end-6 lg:top-6 lg:max-w-full">
                            <Link href="/" className="w-8 block lg:hidden">
                                <img src="/assets/images/logo.svg" alt="UrbanKey" className="mx-auto w-10" />
                            </Link>
                            <div className="dropdown ms-auto w-max">
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
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Registro</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Creá tu usuario de UrbanKey</p>
                            </div>
                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="nombre">Nombre</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="nombre"
                                            type="text"
                                            autoComplete="given-name"
                                            placeholder="Nombre"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={nombre}
                                            onChange={(event) => setNombre(event.target.value)}
                                            required
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconUser fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="apellido">Apellido</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="apellido"
                                            type="text"
                                            autoComplete="family-name"
                                            placeholder="Apellido"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={apellido}
                                            onChange={(event) => setApellido(event.target.value)}
                                            required
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconUser fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="correo">Correo</label>
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
                                    <label htmlFor="password">Contraseña</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="password"
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder="Mínimo 6 caracteres"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            minLength={6}
                                            required
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconLockDots fill={true} />
                                        </span>
                                    </div>
                                </div>
                                {error ? <p className="text-danger">{error}</p> : null}
                                {notice ? <p className="text-white-dark">{notice}</p> : null}
                                <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]" disabled={submitting}>
                                    {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
                                </button>
                            </form>
                            <div className="mt-10 text-center dark:text-white">
                                ¿Ya tenés cuenta?&nbsp;
                                <Link href="/auth/cover-login" className="uppercase text-primary underline transition hover:text-black dark:hover:text-white">
                                    Iniciar sesión
                                </Link>
                            </div>
                        </div>
                        <p className="absolute bottom-6 w-full text-center dark:text-white">© {new Date().getFullYear()} UrbanKey</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterCover;
