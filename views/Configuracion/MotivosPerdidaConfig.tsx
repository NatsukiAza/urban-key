'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '@/store/themeConfigSlice';
import { showToast } from '@/lib/ui/toast';
import { cambiarActivoMotivoPerdida, crearMotivoPerdida, renombrarMotivoPerdida } from '@/lib/configuracion/actions';
import type { MotivoPerdidaConfig } from '@/lib/configuracion/types';
import type { ActionResult } from '@/lib/types';
import PageHeader, { contar } from '@/components/ui/PageHeader';
import IconPlus from '@/components/Icon/IconPlus';

async function pedirNombre(titulo: string, valorInicial = '') {
    const { value, isConfirmed } = await Swal.fire({
        title: titulo,
        input: 'text',
        inputValue: valorInicial,
        inputPlaceholder: 'Ej: Precio fuera de presupuesto',
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        padding: '2em',
        inputValidator: (v) => (!v.trim() ? 'El nombre es obligatorio' : undefined),
    });
    return isConfirmed ? (value as string).trim() : null;
}

const MotivosPerdidaConfig = ({ motivos }: { motivos: MotivoPerdidaConfig[] }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Motivos de pérdida'));
    });

    const [ocupado, setOcupado] = useState(false);

    const ejecutar = async (accion: () => Promise<ActionResult>) => {
        setOcupado(true);
        const res = await accion();
        setOcupado(false);
        showToast(res.mensaje ?? '', res.ok ? 'success' : 'error');
        if (res.ok) router.refresh();
    };

    const nuevo = async () => {
        const nombre = await pedirNombre('Nuevo motivo de pérdida');
        if (nombre) await ejecutar(() => crearMotivoPerdida(nombre));
    };

    const renombrar = async (motivo: MotivoPerdidaConfig) => {
        const nombre = await pedirNombre('Renombrar motivo', motivo.nombre);
        if (nombre && nombre !== motivo.nombre) await ejecutar(() => renombrarMotivoPerdida(motivo.id, nombre));
    };

    const activos = motivos.filter((m) => m.activo).length;

    return (
        <div>
            <PageHeader
                title="Motivos de pérdida"
                description={`${contar(activos, 'motivo activo', 'motivos activos')}. Los inactivos dejan de ofrecerse al cerrar una oportunidad, pero se conservan en las ya perdidas.`}
                actions={
                    <button type="button" className="btn btn-primary gap-2" disabled={ocupado} onClick={nuevo}>
                        <IconPlus className="h-4 w-4" />
                        Nuevo motivo
                    </button>
                }
            />

            <div className="panel">
                {motivos.length === 0 ? (
                    <p className="text-sm text-white-dark">Todavía no hay motivos de pérdida cargados.</p>
                ) : (
                    <div className="space-y-2">
                        {motivos.map((m) => (
                            <div
                                key={m.id}
                                className={`flex flex-wrap items-center gap-3 rounded-md border border-white-light px-3 py-2.5 dark:border-[#1b2e4b] ${m.activo ? '' : 'opacity-60'}`}
                            >
                                <span className="flex-1 font-medium">{m.nombre}</span>
                                {!m.activo && <span className="badge badge-outline-secondary">Inactivo</span>}
                                <div className="flex gap-2">
                                    <button type="button" className="btn btn-sm btn-outline-primary" disabled={ocupado} onClick={() => renombrar(m)}>
                                        Renombrar
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${m.activo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                        disabled={ocupado}
                                        onClick={() => ejecutar(() => cambiarActivoMotivoPerdida(m.id, !m.activo))}
                                    >
                                        {m.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MotivosPerdidaConfig;
