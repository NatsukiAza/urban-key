'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconUser from '../../components/Icon/IconUser';
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';
import IconHome from '../../components/Icon/IconHome';
import { createClient } from '@/lib/supabase/client';
import { limpiarCierreDeSesion } from '@/lib/supabase/sesion-dev';
import { syncUsuarioProfile } from '@/lib/supabase/usuarios';
import { registrarInmobiliaria } from '@/lib/usuarios/actions';

const RegisterCover = ({ registroAbierto }: { registroAbierto: boolean }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [inmobiliaria, setInmobiliaria] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Registro'));
    }, [dispatch]);

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const resultado = await registrarInmobiliaria({
            inmobiliaria,
            nombre,
            apellido,
            correo,
            password,
        });

        if (!resultado.ok) {
            setSubmitting(false);
            setError(resultado.mensaje);
            return;
        }

        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: correo.trim(),
            password,
        });

        if (signInError) {
            setSubmitting(false);
            setError('La inmobiliaria quedó creada. Iniciá sesión con el correo y la contraseña que elegiste.');
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
            <img src="/assets/images/auth/urbankey-logo.webp" alt="UrbanKey" className="absolute top-24 left-6 z-10 hidden h-72 w-auto lg:block xl:h-96" />
            <div className="relative flex h-screen items-center justify-center overflow-y-auto px-6 py-10 dark:bg-[#060818] sm:px-16 lg:justify-end lg:pe-24">
                <div className="relative flex w-full max-w-[460px] flex-col items-center justify-center gap-4 rounded-2xl bg-white/85 px-6 py-6 shadow-2xl backdrop-blur-xl dark:bg-black/60 sm:px-10 sm:py-8">
                    <div className="flex w-full max-w-[440px] items-center gap-2">
                        <Link href="/" className="block lg:hidden">
                            <span className="text-lg font-extrabold uppercase text-primary">UrbanKey</span>
                        </Link>
                    </div>
                    <div className="w-full max-w-[440px]">
                        <div className="mb-6">
                            <h1 className="text-3xl font-extrabold uppercase !leading-snug text-[#502558] md:text-4xl">Registro</h1>
                            <p className="text-base font-bold leading-normal text-white-dark">Creá la inmobiliaria y tu usuario administrador de UrbanKey</p>
                        </div>
                        {registroAbierto ? (
                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="inmobiliaria" className="text-[#502558]">
                                        Inmobiliaria
                                    </label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="inmobiliaria"
                                            type="text"
                                            autoComplete="organization"
                                            placeholder="Nombre de la inmobiliaria"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={inmobiliaria}
                                            onChange={(event) => setInmobiliaria(event.target.value)}
                                            required
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconHome fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="nombre" className="text-[#502558]">
                                        Nombre
                                    </label>
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
                                    <label htmlFor="apellido" className="text-[#502558]">
                                        Apellido
                                    </label>
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
                                    <label htmlFor="correo" className="text-[#502558]">
                                        Correo
                                    </label>
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
                                    <label htmlFor="password" className="text-[#502558]">
                                        Contraseña
                                    </label>
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
                                <button
                                    type="submit"
                                    className="btn !mt-6 w-full border-0 bg-gradient-to-r from-[#502558] to-[#D8AC71] uppercase text-white shadow-[0_10px_20px_-10px_rgba(80,37,88,0.6)] transition-all duration-300 hover:from-[#D8AC71] hover:to-[#502558]"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Creando inmobiliaria...' : 'Crear inmobiliaria'}
                                </button>
                            </form>
                        ) : (
                            <p className="text-base font-bold leading-normal text-white-dark">
                                La inmobiliaria ya está registrada. Pedile al administrador que te cree un usuario.
                            </p>
                        )}
                        {error && !registroAbierto ? <p className="mt-4 text-danger">{error}</p> : null}
                        <div className="mt-6 text-center dark:text-white">
                            ¿Ya tenés cuenta?&nbsp;
                            <Link href="/auth/cover-login" className="uppercase text-[#502558] underline transition hover:text-[#D8AC71] dark:hover:text-white">
                                Iniciar sesión
                            </Link>
                        </div>
                    </div>
                    <p className="mt-4 w-full text-center text-sm dark:text-white">© {new Date().getFullYear()}. UrbanKey. Todos los derechos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default RegisterCover;
