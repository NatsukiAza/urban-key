'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { createClient } from '@/lib/supabase/client';
import { ESTADOS_CONTACTO, crearContacto, estadoLabel, type EstadoContacto } from '@/lib/supabase/contactos';

const ContactoForm = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [estado, setEstado] = useState<EstadoContacto>('POTENCIAL');
    const [esPropietario, setEsPropietario] = useState(false);
    const [esInteresado, setEsInteresado] = useState(false);
    const [observaciones, setObservaciones] = useState('');
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Nuevo contacto'));
    }, [dispatch]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        if (!nombre.trim() || !apellido.trim()) {
            setError('Nombre y apellido son obligatorios.');
            return;
        }

        setGuardando(true);
        const supabase = createClient();
        const resultado = await crearContacto(supabase, {
            nombre,
            apellido,
            email,
            telefono,
            estado,
            es_propietario: esPropietario,
            es_interesado: esInteresado,
            observaciones,
        });
        setGuardando(false);

        if ('error' in resultado) {
            setError(resultado.error);
            return;
        }

        router.push(`/contactos/${resultado.contacto.id}`);
        router.refresh();
    };

    return (
        <div className="panel">
            <div className="mb-5 flex items-center justify-between gap-3">
                <h1 className="text-lg font-semibold dark:text-white-light">Nuevo contacto</h1>
                <Link href="/contactos" className="text-primary hover:underline">
                    Volver al listado
                </Link>
            </div>
            <form className="space-y-5" onSubmit={submit}>
                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="nombre">Nombre</label>
                        <input id="nombre" className="form-input" value={nombre} onChange={(event) => setNombre(event.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="apellido">Apellido</label>
                        <input id="apellido" className="form-input" value={apellido} onChange={(event) => setApellido(event.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="telefono">Teléfono</label>
                        <input id="telefono" className="form-input" value={telefono} onChange={(event) => setTelefono(event.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="estado">Estado</label>
                        <select id="estado" className="form-select" value={estado} onChange={(event) => setEstado(event.target.value as EstadoContacto)}>
                            {ESTADOS_CONTACTO.map((item) => (
                                <option key={item} value={item}>
                                    {estadoLabel[item]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex flex-wrap gap-6">
                    <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" className="form-checkbox" checked={esPropietario} onChange={(event) => setEsPropietario(event.target.checked)} />
                        Es propietario
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" className="form-checkbox" checked={esInteresado} onChange={(event) => setEsInteresado(event.target.checked)} />
                        Es interesado
                    </label>
                </div>
                <div>
                    <label htmlFor="nota">Nota del contacto</label>
                    <textarea id="nota" className="form-textarea" rows={3} value={observaciones} onChange={(event) => setObservaciones(event.target.value)} />
                    <p className="mt-1 text-xs text-white-dark">Este texto queda en el contacto. Las observaciones posteriores se cargan en el detalle y no pisan esta nota.</p>
                </div>
                {error ? <p className="text-danger">{error}</p> : null}
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar contacto'}
                </button>
            </form>
        </div>
    );
};

export default ContactoForm;
