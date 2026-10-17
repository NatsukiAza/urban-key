'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { showToast, toastExito } from '@/lib/ui/toast';
import { modalDesactivar } from '@/lib/ui/modales';
import { cambiarActivoMotivoPerdida, crearMotivoPerdida, renombrarMotivoPerdida } from '@/lib/configuracion/actions';
import type { MotivoPerdidaConfig } from '@/lib/configuracion/types';
import type { ActionResult } from '@/lib/types';
import PageHeader, { contar } from '@/components/ui/PageHeader';
import EstadoPantalla from '@/components/ui/EstadoPantalla';
import { FilaConfig, FilaAlta, FilaInactiva } from '@/components/ui/FilaConfig';
import IconPlus from '@/components/Icon/IconPlus';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';

const DUPLICADO = 'Ya existe un motivo con ese nombre. Elegí otro.';

const MotivosPerdidaConfig = ({ motivos, hayError }: { motivos: MotivoPerdidaConfig[]; hayError: boolean }) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Motivos de pérdida'));
    });

    const [ocupado, setOcupado] = useState(false);
    const [agregando, setAgregando] = useState(false);

    const activos = motivos.filter((m) => m.activo);
    const inactivos = motivos.filter((m) => !m.activo);
    const nombres = motivos.map((m) => m.nombre);

    // Devuelve el mensaje de error o null si salió bien (y avisa el éxito).
    const ejecutar = async (accion: () => Promise<ActionResult>): Promise<string | null> => {
        setOcupado(true);
        const res = await accion();
        setOcupado(false);
        if (res.ok) {
            toastExito(res.mensaje ?? 'Listo');
            router.refresh();
            return null;
        }
        return res.mensaje ?? 'No se pudo completar la acción';
    };

    const avisarFalla = (falla: string | null) => {
        if (falla) showToast(falla, 'error');
    };

    const desactivar = async (motivo: MotivoPerdidaConfig) => {
        const ok = await modalDesactivar({ titulo: `¿Desactivar ${motivo.nombre}?`, texto: 'Deja de ofrecerse al cerrar una oportunidad como perdida. Se conserva en las que ya lo usaron.' });
        if (ok) avisarFalla(await ejecutar(() => cambiarActivoMotivoPerdida(motivo.id, false)));
    };

    if (hayError) {
        return (
            <div className="mx-auto flex max-w-[880px] flex-col gap-5">
                <PageHeader title="Motivos de pérdida" description="Se ofrecen al cerrar una oportunidad como perdida." />
                <EstadoPantalla
                    variante="error"
                    icono={<IconInfoTriangle className="h-7 w-7" />}
                    titulo="No pudimos cargar los motivos"
                    descripcion="Puede ser un problema de conexión. Tus datos no se perdieron."
                    acciones={
                        <button type="button" className="btn btn-primary h-10 rounded-[10px]" onClick={() => router.refresh()}>
                            Reintentar
                        </button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="mx-auto flex max-w-[880px] flex-col gap-5">
            <PageHeader
                title="Motivos de pérdida"
                description="Se ofrecen al cerrar una oportunidad como perdida."
                actions={
                    <button type="button" className="btn btn-primary h-[42px] gap-2 rounded-[10px]" disabled={ocupado || agregando} onClick={() => setAgregando(true)}>
                        <IconPlus />
                        Nuevo motivo
                    </button>
                }
            />

            <section className="flex flex-col gap-3.5 rounded-[14px] border border-uk-line bg-white px-6 pb-6 pt-5 shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:border-[#232C45] dark:bg-uk-card-dark dark:shadow-none">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-base font-extrabold text-uk-ink dark:text-uk-ink-dark">Activos</h2>
                    <span className="text-[13px] text-uk-muted dark:text-uk-muted-dark">{contar(activos.length, 'motivo', 'motivos')}</span>
                </div>

                {activos.length === 0 && !agregando ? (
                    <EstadoPantalla
                        variante="vacio"
                        icono={<IconPlus className="h-7 w-7" />}
                        titulo="Todavía no hay motivos de pérdida"
                        descripcion="Sin motivos activos no se puede cerrar una oportunidad como perdida."
                        acciones={
                            <button type="button" className="btn btn-primary h-10 rounded-[10px]" onClick={() => setAgregando(true)}>
                                Nuevo motivo
                            </button>
                        }
                    />
                ) : (
                    <ul className="flex flex-col gap-2">
                        {agregando ? (
                            <FilaAlta
                                placeholder="Ej.: No consiguió garantía"
                                existentes={nombres}
                                mensajeDuplicado={DUPLICADO}
                                onCancelar={() => setAgregando(false)}
                                onAgregar={async (nombre) => {
                                    const falla = await ejecutar(() => crearMotivoPerdida(nombre));
                                    if (!falla) setAgregando(false);
                                    return falla;
                                }}
                            />
                        ) : null}
                        {activos.map((m) => (
                            <FilaConfig
                                key={m.id}
                                nombre={m.nombre}
                                ocupado={ocupado}
                                existentes={nombres.filter((n) => n !== m.nombre)}
                                mensajeDuplicado={DUPLICADO}
                                onGuardar={(nombre) => ejecutar(() => renombrarMotivoPerdida(m.id, nombre))}
                                desactivar={{ descripcion: 'Deja de ofrecerse al cerrar como perdida.', onClick: () => void desactivar(m) }}
                            />
                        ))}
                    </ul>
                )}

                {inactivos.length > 0 ? (
                    <details className="border-t border-uk-col pt-3 dark:border-[#232C45]">
                        <summary className="cursor-pointer py-1.5 text-[13px] font-extrabold text-uk-muted dark:text-uk-muted-dark">Inactivos ({inactivos.length})</summary>
                        <p className="mb-2.5 mt-1 text-xs text-uk-muted dark:text-uk-muted-dark">No se ofrecen al cerrar, pero se conservan en las oportunidades que ya los usaron.</p>
                        <ul className="flex flex-col gap-2">
                            {inactivos.map((m) => (
                                <FilaInactiva key={m.id} nombre={m.nombre} ocupado={ocupado} onActivar={() => void ejecutar(() => cambiarActivoMotivoPerdida(m.id, true)).then(avisarFalla)} />
                            ))}
                        </ul>
                    </details>
                ) : null}
            </section>
        </div>
    );
};

export default MotivosPerdidaConfig;
