'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import type { DataTableSortStatus } from 'mantine-datatable';
import sortBy from 'lodash/sortBy';
import { setPageTitle } from '@/store/themeConfigSlice';
import { rolUsuarioConfig, rolUsuarioOptions, type RolUsuario } from '@/lib/enums/rolUsuario';
import { crearEmpleado, regenerarContrasena } from '@/lib/usuarios/actions';
import { generarContrasenaTemporal } from '@/lib/usuarios/contrasena';
import { modalGenerarContrasena } from '@/lib/ui/modales';
import { showToast } from '@/lib/ui/toast';
import PageHeader from '@/components/ui/PageHeader';
import EstadoPantalla from '@/components/ui/EstadoPantalla';
import MenuFilaTabla from '@/components/ui/MenuFilaTabla';
import PanelLateral from '@/components/ui/PanelLateral';
import { inicialesDe } from '@/components/ui/Iniciales';
import { Campo, claseInput, claseInvalido } from '@/components/ui/FormPartes';
import IconPlus from '@/components/Icon/IconPlus';
import IconSearch from '@/components/Icon/IconSearch';
import IconUser from '@/components/Icon/IconUser';
import IconEye from '@/components/Icon/IconEye';

export type UsuarioListado = {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: RolUsuario;
    activo: boolean;
};

const DataTable = dynamic(() => import('mantine-datatable').then((mod) => mod.DataTable), { ssr: false }) as any;

const PAGE_SIZES = [10, 20, 30];

const DESCRIPCION_ROL: Record<RolUsuario, string> = {
    VENDEDOR: 'Opera sus propias oportunidades.',
    RESPONSABLE_COMERCIAL: 'Ve las del equipo y puede reasignarlas.',
    ADMINISTRADOR: 'Ve todo y configura el sistema.',
};

const Escudo = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
    </svg>
);

const IconCopiar = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </svg>
);

const RolChip = ({ rol }: { rol: RolUsuario }) =>
    rol === 'ADMINISTRADOR' ? (
        <span className="inline-flex h-6 items-center gap-1.5 rounded-md bg-primary-light px-2 text-xs font-extrabold text-primary dark:bg-uk-link-dark/[.12] dark:text-uk-link-dark">
            <Escudo />
            {rolUsuarioConfig[rol].label}
        </span>
    ) : (
        <span className="inline-flex h-6 items-center rounded-md bg-uk-col px-2 text-xs font-extrabold text-uk-muted dark:bg-white/5 dark:text-uk-muted-dark">{rolUsuarioConfig[rol].label}</span>
    );

const errorDeCorreo = (correo: string): string => {
    const valor = correo.trim();
    if (!valor) return 'Cargá el correo.';
    if (!valor.includes('@')) return 'Revisá el correo: falta la @.';
    if (/@\s*$/.test(valor)) return 'Revisá el correo: falta lo que va después de la @.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor) ? '' : 'Revisá el correo: no parece válido.';
};

type Credenciales = { nombre: string; correo: string; password: string; modo: 'creado' | 'regenerada' };
type Errores = Partial<Record<'nombre' | 'apellido' | 'correo' | 'password', string>>;

const UsuariosAdmin = ({ usuarios, usuarioActualId }: { usuarios: UsuarioListado[]; usuarioActualId?: string }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [busqueda, setBusqueda] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'apellido', direction: 'asc' });

    const [formAbierto, setFormAbierto] = useState(false);
    const [credenciales, setCredenciales] = useState<Credenciales | null>(null);
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [correo, setCorreo] = useState('');
    const [rol, setRol] = useState<RolUsuario>('VENDEDOR');
    const [password, setPassword] = useState('');
    const [verPassword, setVerPassword] = useState(true);
    const [errores, setErrores] = useState<Errores>({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [copiado, setCopiado] = useState<'clave' | 'todo' | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('Usuarios'));
    }, [dispatch]);

    const visibles = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        const base = q ? usuarios.filter((u) => `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(q)) : usuarios;
        const clave = sortStatus.columnAccessor as string;
        const ordenados = sortBy(base, (u) => (clave === 'rol' ? rolUsuarioConfig[u.rol].label : clave === 'activo' ? (u.activo ? 0 : 1) : String(u[clave as keyof UsuarioListado] ?? '').toLowerCase()));
        return sortStatus.direction === 'desc' ? ordenados.reverse() : ordenados;
    }, [usuarios, busqueda, sortStatus]);

    useEffect(() => setPage(1), [busqueda, pageSize, sortStatus]);
    const records = useMemo(() => visibles.slice((page - 1) * pageSize, page * pageSize), [visibles, page, pageSize]);

    const activos = usuarios.filter((u) => u.activo).length;
    const subtitulo = `${usuarios.length} ${usuarios.length === 1 ? 'usuario' : 'usuarios'} · ${activos} ${activos === 1 ? 'activo' : 'activos'}. Quiénes pueden entrar a UrbanKey y con qué permisos.`;

    const abrirForm = () => {
        setNombre('');
        setApellido('');
        setCorreo('');
        setRol('VENDEDOR');
        setPassword(generarContrasenaTemporal());
        setVerPassword(true);
        setErrores({});
        setErrorGeneral('');
        setCredenciales(null);
        setFormAbierto(true);
    };

    const cerrar = () => {
        setFormAbierto(false);
        setCredenciales(null);
    };

    const limpiar = (campo: keyof Errores) => setErrores((e) => ({ ...e, [campo]: undefined }));

    const crear = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorGeneral('');
        const nuevos: Errores = {};
        if (!nombre.trim()) nuevos.nombre = 'Cargá el nombre.';
        if (!apellido.trim()) nuevos.apellido = 'Cargá el apellido.';
        const errCorreo = errorDeCorreo(correo);
        if (errCorreo) nuevos.correo = errCorreo;
        if (password.length < 6) nuevos.password = 'Mínimo 6 caracteres.';
        setErrores(nuevos);
        const primero = (['nombre', 'apellido', 'correo', 'password'] as const).find((c) => nuevos[c]);
        if (primero) {
            document.getElementById(`usuario-${primero}`)?.focus();
            return;
        }

        setGuardando(true);
        const resultado = await crearEmpleado({ nombre, apellido, correo, rol, password });
        setGuardando(false);
        if (!resultado.ok) {
            setErrorGeneral(resultado.mensaje);
            return;
        }
        setCredenciales({ nombre: `${nombre.trim()} ${apellido.trim()}`, correo: correo.trim().toLowerCase(), password: resultado.data?.contrasenaTemporal ?? password, modo: 'creado' });
        router.refresh();
    };

    const regenerar = async (u: UsuarioListado) => {
        const nombreCompleto = `${u.nombre} ${u.apellido}`.trim();
        if (!(await modalGenerarContrasena(nombreCompleto))) return;
        const nueva = generarContrasenaTemporal();
        const resultado = await regenerarContrasena(u.id, nueva);
        if (!resultado.ok) {
            showToast(resultado.mensaje, 'error');
            return;
        }
        setCredenciales({ nombre: nombreCompleto, correo: u.email, password: resultado.data?.contrasenaTemporal ?? nueva, modo: 'regenerada' });
        setFormAbierto(true);
    };

    const copiar = async (texto: string, cual: 'clave' | 'todo') => {
        try {
            await navigator.clipboard.writeText(texto);
            setCopiado(cual);
            setTimeout(() => setCopiado(null), 1800);
        } catch {
            showToast('No se pudo copiar. Seleccionalo y copialo a mano.', 'error');
        }
    };

    const botonNuevo = (
        <button type="button" onClick={abrirForm} className="btn btn-primary h-[42px] gap-2 rounded-[10px]">
            <IconPlus />
            Nuevo usuario
        </button>
    );

    return (
        <div>
            <PageHeader title="Usuarios" description={subtitulo} actions={botonNuevo} />

            <div className="panel !rounded-[14px] !p-0 shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:!border dark:!border-[#232C45] dark:!bg-uk-card-dark dark:shadow-none">
                <div className="border-b border-uk-line px-5 py-4 dark:border-[#232C45]">
                    <label className="relative !mb-0 flex h-[38px] w-full items-center sm:max-w-[320px]">
                        <span className="sr-only">Buscar usuarios</span>
                        <IconSearch className="pointer-events-none absolute left-3 h-4 w-4 text-uk-muted dark:text-uk-muted-dark" />
                        <input type="search" className="form-input h-[38px] w-full rounded-[9px] pl-9 text-[13px] dark:!bg-uk-page-dark" placeholder="Buscar por nombre o correo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </label>
                </div>

                {usuarios.length === 0 ? (
                    <div className="px-5 py-5">
                        <EstadoPantalla variante="vacio" icono={<IconUser className="h-7 w-7" duotone={false} />} titulo="Todavía no hay usuarios" descripcion="Creá el primero para darle acceso a UrbanKey." acciones={botonNuevo} />
                    </div>
                ) : visibles.length === 0 ? (
                    <div className="px-5 py-5">
                        <EstadoPantalla
                            variante="vacio"
                            icono={<IconSearch className="h-7 w-7" />}
                            titulo="Ningún usuario coincide"
                            descripcion={`No hay resultados para “${busqueda.trim()}”.`}
                            acciones={
                                <button type="button" className="btn btn-cancel h-10 rounded-[10px]" onClick={() => setBusqueda('')}>
                                    Limpiar filtros
                                </button>
                            }
                        />
                    </div>
                ) : (
                    <div className="datatables tabla-lista pagination-padding">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={records}
                            minHeight={0}
                            highlightOnHover
                            columns={[
                                {
                                    accessor: 'apellido',
                                    title: 'Usuario',
                                    sortable: true,
                                    render: (u: UsuarioListado) => {
                                        const yo = u.id === usuarioActualId;
                                        return (
                                            <div className="flex items-center gap-3">
                                                <span className={`grid h-9 w-9 shrink-0 place-content-center rounded-full text-xs font-extrabold ${yo ? 'bg-primary text-white dark:bg-uk-link-dark dark:text-uk-card-dark' : 'bg-primary-light text-primary dark:bg-white/10 dark:text-uk-link-dark'}`}>{inicialesDe(u.nombre, u.apellido)}</span>
                                                <span className="flex min-w-0 flex-col">
                                                    <span className="text-sm font-extrabold text-uk-ink dark:text-uk-ink-dark">
                                                        {u.nombre} {u.apellido}
                                                        {yo ? <span className="font-semibold text-uk-muted dark:text-uk-muted-dark"> (vos)</span> : null}
                                                    </span>
                                                    <span className="text-xs text-uk-muted dark:text-uk-muted-dark">{u.email}</span>
                                                </span>
                                            </div>
                                        );
                                    },
                                },
                                { accessor: 'rol', title: 'Rol', sortable: true, render: (u: UsuarioListado) => <RolChip rol={u.rol} /> },
                                {
                                    accessor: 'activo',
                                    title: 'Estado',
                                    sortable: true,
                                    render: (u: UsuarioListado) => (
                                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-uk-ink dark:text-uk-ink-dark">
                                            <span className={`h-2 w-2 rounded-full ${u.activo ? 'bg-success' : 'bg-uk-muted dark:bg-uk-muted-dark'}`} />
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'acciones',
                                    title: <span className="sr-only">Acciones</span>,
                                    textAlignment: 'right',
                                    width: 70,
                                    render: (u: UsuarioListado) =>
                                        u.id === usuarioActualId ? null : (
                                            <div className="flex justify-end">
                                                <MenuFilaTabla ariaLabel={`Acciones de ${u.nombre} ${u.apellido}`} items={[{ etiqueta: 'Generar contraseña nueva', onClick: () => regenerar(u) }]} />
                                            </div>
                                        ),
                                },
                            ]}
                            totalRecords={visibles.length}
                            recordsPerPage={pageSize}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            recordsPerPageLabel="Por página"
                            page={page}
                            onPageChange={(p: number) => setPage(p)}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            paginationText={({ from, to, totalRecords }: any) => `Mostrando ${from}–${to} de ${totalRecords}`}
                        />
                    </div>
                )}
            </div>

            <PanelLateral
                abierto={formAbierto}
                onCerrar={cerrar}
                sinEncabezado={!!credenciales}
                titulo={credenciales ? credenciales.nombre : 'Nuevo usuario'}
                descripcion="Va a poder entrar con su correo y una contraseña temporal."
                pie={
                    credenciales ? (
                        <>
                            {credenciales.modo === 'creado' ? (
                                <button type="button" className="btn btn-cancel h-[42px] rounded-[10px] px-[18px]" onClick={abrirForm}>
                                    Crear otro
                                </button>
                            ) : null}
                            <button type="button" data-foco-inicial className="btn btn-primary h-[42px] rounded-[10px] px-5 font-extrabold" onClick={cerrar}>
                                Listo
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="btn btn-cancel h-[42px] rounded-[10px] px-[18px]" onClick={cerrar}>
                                Cancelar
                            </button>
                            <button type="submit" form="form-nuevo-usuario" className="btn btn-primary h-[42px] rounded-[10px] px-5 font-extrabold" disabled={guardando}>
                                {guardando ? 'Creando…' : 'Crear usuario'}
                            </button>
                        </>
                    )
                }
            >
                {credenciales ? (
                    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-8">
                        <span className="grid h-14 w-14 place-content-center rounded-full bg-[#E6F6EE] text-uk-won dark:bg-success/15 dark:text-uk-won-dark">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="m5 12 5 5 9-10" />
                            </svg>
                        </span>
                        <div className="flex flex-col gap-1.5">
                            <h2 className="text-[22px] font-extrabold text-uk-ink dark:text-uk-ink-dark">{credenciales.modo === 'creado' ? `Listo, creaste a ${credenciales.nombre}` : `Nueva contraseña para ${credenciales.nombre}`}</h2>
                            <p className="text-sm leading-normal text-uk-muted dark:text-uk-muted-dark">Pasale estos datos por un canal seguro. Es la única vez que vas a ver la contraseña.</p>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-uk-line dark:border-[#232C45]">
                            <div className="flex flex-col gap-0.5 border-b border-uk-col px-4 py-3.5 dark:border-[#232C45]">
                                <span className="text-xs font-bold text-uk-muted dark:text-uk-muted-dark">Correo</span>
                                <span className="break-all text-sm font-bold text-uk-ink dark:text-uk-ink-dark">{credenciales.correo}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 bg-[#FBF6EE] px-4 py-3.5 dark:bg-gold/10">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-uk-muted dark:text-uk-muted-dark">Contraseña temporal</span>
                                    <span className="font-mono text-lg font-extrabold tracking-wide text-uk-ink dark:text-uk-ink-dark">{credenciales.password}</span>
                                </div>
                                <button type="button" onClick={() => copiar(credenciales.password, 'clave')} className="inline-flex h-[38px] items-center gap-1.5 rounded-[9px] border border-primary bg-white px-3.5 text-[13px] font-extrabold text-primary hover:bg-primary-light dark:border-uk-link-dark dark:bg-transparent dark:text-uk-link-dark dark:hover:bg-white/5">
                                    <IconCopiar />
                                    {copiado === 'clave' ? 'Copiado' : 'Copiar'}
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => copiar(`Correo: ${credenciales.correo}\nContraseña temporal: ${credenciales.password}`, 'todo')}
                            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] border border-uk-field bg-white text-sm font-extrabold text-uk-ink hover:bg-uk-col dark:border-uk-field-dark dark:bg-transparent dark:text-uk-ink-dark dark:hover:bg-white/5"
                        >
                            <span className="text-primary dark:text-uk-link-dark">
                                <IconCopiar />
                            </span>
                            {copiado === 'todo' ? 'Copiado' : 'Copiar correo y contraseña'}
                        </button>
                        <p className="text-xs leading-normal text-uk-muted dark:text-uk-muted-dark">En el primer ingreso le vamos a pedir que la cambie. Si la pierde, podés generar una nueva desde el menú ⋯ del usuario.</p>
                    </div>
                ) : (
                    <form id="form-nuevo-usuario" noValidate onSubmit={crear} className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-6 py-5">
                        <div className="grid grid-cols-2 gap-3">
                            <Campo id="usuario-nombre" etiqueta="Nombre" error={errores.nombre}>
                                <input
                                    id="usuario-nombre"
                                    value={nombre}
                                    onChange={(e) => {
                                        setNombre(e.target.value);
                                        limpiar('nombre');
                                    }}
                                    aria-invalid={Boolean(errores.nombre) || undefined}
                                    className={`${claseInput} ${errores.nombre ? claseInvalido : ''}`}
                                />
                            </Campo>
                            <Campo id="usuario-apellido" etiqueta="Apellido" error={errores.apellido}>
                                <input
                                    id="usuario-apellido"
                                    value={apellido}
                                    onChange={(e) => {
                                        setApellido(e.target.value);
                                        limpiar('apellido');
                                    }}
                                    aria-invalid={Boolean(errores.apellido) || undefined}
                                    className={`${claseInput} ${errores.apellido ? claseInvalido : ''}`}
                                />
                            </Campo>
                        </div>
                        <Campo id="usuario-correo" etiqueta="Correo" error={errores.correo}>
                            <input
                                id="usuario-correo"
                                type="email"
                                autoComplete="off"
                                value={correo}
                                onChange={(e) => {
                                    setCorreo(e.target.value);
                                    limpiar('correo');
                                }}
                                aria-invalid={Boolean(errores.correo) || undefined}
                                aria-describedby={errores.correo ? 'usuario-correo-error' : undefined}
                                className={`${claseInput} ${errores.correo ? claseInvalido : ''}`}
                            />
                        </Campo>
                        <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
                            <legend className="mb-2 p-0 text-[13px] font-bold text-uk-ink dark:text-uk-ink-dark">Rol</legend>
                            {rolUsuarioOptions
                                .slice()
                                .sort((a, b) => ['VENDEDOR', 'RESPONSABLE_COMERCIAL', 'ADMINISTRADOR'].indexOf(a.value) - ['VENDEDOR', 'RESPONSABLE_COMERCIAL', 'ADMINISTRADOR'].indexOf(b.value))
                                .map((o) => (
                                    <label
                                        key={o.value}
                                        className={`!mb-0 flex cursor-pointer items-start gap-3 rounded-[10px] px-3.5 py-3 ${
                                            rol === o.value ? 'border-[1.5px] border-primary bg-[#FBF8FC] dark:border-uk-link-dark dark:bg-uk-link-dark/10' : 'border border-uk-field hover:bg-uk-page dark:border-uk-field-dark dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <input type="radio" name="rol" checked={rol === o.value} onChange={() => setRol(o.value)} className="form-radio mt-[3px] shrink-0" />
                                        <span className="flex flex-col gap-0.5">
                                            <span className="text-sm font-extrabold text-uk-ink dark:text-uk-ink-dark">{o.label}</span>
                                            <span className="text-xs text-uk-muted dark:text-uk-muted-dark">{DESCRIPCION_ROL[o.value]}</span>
                                        </span>
                                    </label>
                                ))}
                        </fieldset>
                        <Campo id="usuario-password" etiqueta="Contraseña temporal" error={errores.password} ayuda="Mínimo 6 caracteres. En el primer ingreso la tiene que cambiar.">
                            <div className="flex gap-2">
                                <div className={`flex h-[42px] flex-1 overflow-hidden rounded-[9px] border focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15 dark:focus-within:border-uk-link-dark dark:focus-within:ring-uk-link-dark/20 ${errores.password ? 'border-[1.5px] border-uk-lost dark:border-uk-lost-dark' : 'border-uk-field dark:border-uk-field-dark'}`}>
                                    <input
                                        id="usuario-password"
                                        type={verPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            limpiar('password');
                                        }}
                                        aria-invalid={Boolean(errores.password) || undefined}
                                        className="min-w-0 flex-1 border-0 bg-transparent px-3 font-mono text-sm font-extrabold tracking-wide text-uk-ink outline-none dark:bg-uk-page-dark dark:text-uk-ink-dark"
                                    />
                                    <button type="button" aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVerPassword((v) => !v)} className="grid w-10 place-content-center border-l border-uk-field bg-uk-page text-uk-muted dark:border-uk-field-dark dark:bg-white/5 dark:text-uk-muted-dark">
                                        <IconEye className="h-4 w-4" />
                                    </button>
                                </div>
                                <button type="button" onClick={() => setPassword(generarContrasenaTemporal())} className="h-[42px] rounded-[9px] border border-primary bg-white px-3 text-[13px] font-extrabold text-primary hover:bg-primary-light dark:border-uk-link-dark dark:bg-transparent dark:text-uk-link-dark dark:hover:bg-white/5">
                                    Generar
                                </button>
                            </div>
                        </Campo>
                        <div className="flex gap-2.5 rounded-[10px] bg-primary-light px-3.5 py-3 text-[13px] leading-normal text-[#3A1A40] dark:bg-uk-link-dark/10 dark:text-uk-ink-dark">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className="mt-0.5 shrink-0 text-primary dark:text-uk-link-dark">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 11v5M12 8h.01" />
                            </svg>
                            <span>No se envía por correo. Cuando lo crees vas a poder copiarla para pasársela.</span>
                        </div>
                        {errorGeneral ? (
                            <p role="alert" className="text-sm font-bold text-uk-lost dark:text-uk-lost-dark">
                                {errorGeneral}
                            </p>
                        ) : null}
                    </form>
                )}
            </PanelLateral>
        </div>
    );
};

export default UsuariosAdmin;
