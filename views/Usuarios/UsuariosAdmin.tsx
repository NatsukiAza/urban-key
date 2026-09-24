'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { rolUsuarioConfig, rolUsuarioOptions, type RolUsuario } from '@/lib/enums/rolUsuario';
import { crearEmpleado } from '@/lib/usuarios/actions';

export type UsuarioListado = {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: RolUsuario;
    activo: boolean;
};

const UsuariosAdmin = ({ usuarios }: { usuarios: UsuarioListado[] }) => {
    const dispatch = useDispatch();
    const router = useRouter();

    useEffect(() => {
        dispatch(setPageTitle('Usuarios'));
    }, [dispatch]);
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [correo, setCorreo] = useState('');
    const [rol, setRol] = useState<RolUsuario>('VENDEDOR');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [temporal, setTemporal] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setTemporal('');
        setSubmitting(true);

        const resultado = await crearEmpleado({ nombre, apellido, correo, rol, password });
        setSubmitting(false);

        if (!resultado.ok) {
            setError(resultado.mensaje);
            return;
        }

        setTemporal(resultado.data?.contrasenaTemporal ?? password);
        setNombre('');
        setApellido('');
        setCorreo('');
        setRol('VENDEDOR');
        setPassword('');
        router.refresh();
    };

    return (
        <div className="space-y-6">
            <div className="panel">
                <h1 className="mb-5 text-lg font-semibold dark:text-white-light">Usuarios</h1>
                {usuarios.length === 0 ? <p className="text-white-dark">Todavía no hay usuarios.</p> : null}
                {usuarios.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Correo</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map((usuario) => (
                                    <tr key={usuario.id}>
                                        <td className="font-semibold">
                                            {usuario.nombre} {usuario.apellido}
                                        </td>
                                        <td>{usuario.email}</td>
                                        <td>{rolUsuarioConfig[usuario.rol].label}</td>
                                        <td>{usuario.activo ? 'Activo' : 'Inactivo'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </div>

            <div className="panel">
                <h2 className="mb-5 text-lg font-semibold dark:text-white-light">Nuevo empleado</h2>
                <p className="mb-5 text-white-dark">La contraseña es temporal. En el primer ingreso la tiene que cambiar. No se envía por correo: copiala y pasásela.</p>
                <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitForm}>
                    <div>
                        <label htmlFor="nombre">Nombre</label>
                        <input id="nombre" className="form-input" value={nombre} onChange={(event) => setNombre(event.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="apellido">Apellido</label>
                        <input id="apellido" className="form-input" value={apellido} onChange={(event) => setApellido(event.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="correo">Correo</label>
                        <input id="correo" type="email" className="form-input" value={correo} onChange={(event) => setCorreo(event.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="rol">Rol</label>
                        <select id="rol" className="form-select" value={rol} onChange={(event) => setRol(event.target.value as RolUsuario)}>
                            {rolUsuarioOptions.map((opcion) => (
                                <option key={opcion.value} value={opcion.value}>
                                    {opcion.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="password">Contraseña temporal</label>
                        <input
                            id="password"
                            type="text"
                            autoComplete="off"
                            className="form-input"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={6}
                            required
                        />
                    </div>
                    {error ? <p className="text-danger sm:col-span-2">{error}</p> : null}
                    {temporal ? (
                        <p className="sm:col-span-2 text-[#502558]">
                            Usuario creado. Contraseña temporal: <span className="font-semibold">{temporal}</span>
                        </p>
                    ) : null}
                    <div className="sm:col-span-2">
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Creando...' : 'Crear usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UsuariosAdmin;
