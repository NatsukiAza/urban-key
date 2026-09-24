'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconLockDots from '../../components/Icon/IconLockDots';
import { cambiarContrasena } from '@/lib/usuarios/actions';

const CambiarContrasenaCover = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Cambiar contraseña'));
    }, [dispatch]);

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmacion) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setSubmitting(true);
        const resultado = await cambiarContrasena(password);
        setSubmitting(false);
        if (!resultado.ok) {
            setError(resultado.mensaje);
            return;
        }

        router.push('/');
        router.refresh();
    };

    return (
        <div className="relative h-screen overflow-hidden bg-white dark:bg-[#060818]">
            <img src="/assets/images/auth/urbankey-logo.webp" alt="UrbanKey" className="absolute top-24 left-6 z-10 hidden h-72 w-auto lg:block xl:h-96" />
            <div className="relative flex h-screen items-center justify-center overflow-y-auto px-6 py-10 dark:bg-[#060818] sm:px-16 lg:justify-end lg:pe-24">
                <div className="relative flex w-full max-w-[460px] flex-col items-center justify-center gap-4 rounded-2xl bg-white/85 px-6 py-6 shadow-2xl backdrop-blur-xl dark:bg-black/60 sm:px-10 sm:py-8">
                    <div className="w-full max-w-[440px]">
                        <div className="mb-6">
                            <h1 className="text-3xl font-extrabold uppercase !leading-snug text-[#502558] md:text-4xl">Nueva contraseña</h1>
                            <p className="text-base font-bold leading-normal text-white-dark">Es tu primer ingreso. Cambiá la contraseña temporal antes de usar UrbanKey.</p>
                        </div>
                        <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                            <div>
                                <label htmlFor="password" className="text-[#502558]">
                                    Contraseña nueva
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
                            <div>
                                <label htmlFor="confirmacion" className="text-[#502558]">
                                    Repetir contraseña
                                </label>
                                <div className="relative text-white-dark">
                                    <input
                                        id="confirmacion"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="Repetí la contraseña"
                                        className="form-input ps-10 placeholder:text-white-dark"
                                        value={confirmacion}
                                        onChange={(event) => setConfirmacion(event.target.value)}
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
                                {submitting ? 'Guardando...' : 'Guardar contraseña'}
                            </button>
                        </form>
                    </div>
                    <p className="mt-4 w-full text-center text-sm dark:text-white">© {new Date().getFullYear()}. UrbanKey. Todos los derechos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default CambiarContrasenaCover;
