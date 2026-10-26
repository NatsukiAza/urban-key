'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { showToast, toastExito } from '@/lib/ui/toast';
import { modalDesactivar } from '@/lib/ui/modales';
import type { ItemCatalogoConfig } from '@/lib/configuracion/types';
import type { ActionResult } from '@/lib/types';
import PageHeader, { contar } from '@/components/ui/PageHeader';
import EstadoPantalla from '@/components/ui/EstadoPantalla';
import { FilaConfig, FilaAlta, FilaInactiva } from '@/components/ui/FilaConfig';
import IconPlus from '@/components/Icon/IconPlus';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';

export interface TextosCatalogo {
    titulo: string;
    descripcion: string;
    singular: string;
    plural: string;
    botonNuevo: string;
    etiquetaAlta: string;
    placeholder: string;
    duplicado: string;
    errorCarga: string;
    vacioTitulo: string;
    vacioDescripcion: string;
    desactivarMenu: string;
    desactivarModal: string;
    inactivosAyuda: string;
    sistemaAyuda?: string;
}

interface Props {
    items: ItemCatalogoConfig[];
    hayError: boolean;
    textos: TextosCatalogo;
    crear: (nombre: string) => Promise<ActionResult>;
    renombrar: (id: string, nombre: string) => Promise<ActionResult>;
    cambiarActivo: (id: string, activo: boolean) => Promise<ActionResult>;
}

const CatalogoConfig = ({ items, hayError, textos, crear, renombrar, cambiarActivo }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle(textos.titulo));
    });

    const [ocupado, setOcupado] = useState(false);
    const [agregando, setAgregando] = useState(false);

    const activos = items.filter((i) => i.activo);
    const inactivos = items.filter((i) => !i.activo);
    const nombres = items.map((i) => i.nombre);

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

    const desactivar = async (item: ItemCatalogoConfig) => {
        const ok = await modalDesactivar({ titulo: `¿Desactivar ${item.nombre}?`, texto: textos.desactivarModal });
        if (ok) avisarFalla(await ejecutar(() => cambiarActivo(item.id, false)));
    };

    if (hayError) {
        return (
            <div className="mx-auto flex max-w-[880px] flex-col gap-5">
                <PageHeader title={textos.titulo} description={textos.descripcion} />
                <EstadoPantalla
                    variante="error"
                    icono={<IconInfoTriangle className="h-7 w-7" />}
                    titulo={textos.errorCarga}
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
                title={textos.titulo}
                description={textos.descripcion}
                actions={
                    <button type="button" className="btn btn-primary h-[42px] gap-2 rounded-[10px]" disabled={ocupado || agregando} onClick={() => setAgregando(true)}>
                        <IconPlus />
                        {textos.botonNuevo}
                    </button>
                }
            />

            <section className="flex flex-col gap-3.5 rounded-[14px] border border-uk-line bg-white px-6 pb-6 pt-5 shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:border-[#232C45] dark:bg-uk-card-dark dark:shadow-none">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-base font-extrabold text-uk-ink dark:text-uk-ink-dark">Activos</h2>
                    <span className="text-[13px] text-uk-muted dark:text-uk-muted-dark">{contar(activos.length, textos.singular, textos.plural)}</span>
                </div>

                {activos.length === 0 && !agregando ? (
                    <EstadoPantalla
                        variante="vacio"
                        icono={<IconPlus className="h-7 w-7" />}
                        titulo={textos.vacioTitulo}
                        descripcion={textos.vacioDescripcion}
                        acciones={
                            <button type="button" className="btn btn-primary h-10 rounded-[10px]" onClick={() => setAgregando(true)}>
                                {textos.botonNuevo}
                            </button>
                        }
                    />
                ) : (
                    <ul className="flex flex-col gap-2">
                        {agregando ? (
                            <FilaAlta
                                etiqueta={textos.etiquetaAlta}
                                placeholder={textos.placeholder}
                                existentes={nombres}
                                mensajeDuplicado={textos.duplicado}
                                onCancelar={() => setAgregando(false)}
                                onAgregar={async (nombre) => {
                                    const falla = await ejecutar(() => crear(nombre));
                                    if (!falla) setAgregando(false);
                                    return falla;
                                }}
                            />
                        ) : null}
                        {activos.map((i) => (
                            <FilaConfig
                                key={i.id}
                                nombre={i.nombre}
                                ocupado={ocupado}
                                existentes={nombres.filter((n) => n !== i.nombre)}
                                mensajeDuplicado={textos.duplicado}
                                onGuardar={(nombre) => ejecutar(() => renombrar(i.id, nombre))}
                                derecha={
                                    i.esSistema ? (
                                        <span
                                            title={textos.sistemaAyuda}
                                            className="mr-1 inline-flex h-6 shrink-0 items-center rounded-md bg-uk-col px-2 text-xs font-bold text-uk-muted dark:bg-white/5 dark:text-uk-muted-dark"
                                        >
                                            Del sistema
                                        </span>
                                    ) : undefined
                                }
                                desactivar={i.esSistema ? undefined : { descripcion: textos.desactivarMenu, onClick: () => void desactivar(i) }}
                            />
                        ))}
                    </ul>
                )}

                {inactivos.length > 0 ? (
                    <details className="border-t border-uk-col pt-3 dark:border-[#232C45]">
                        <summary className="cursor-pointer py-1.5 text-[13px] font-extrabold text-uk-muted dark:text-uk-muted-dark">Inactivos ({inactivos.length})</summary>
                        <p className="mb-2.5 mt-1 text-xs text-uk-muted dark:text-uk-muted-dark">{textos.inactivosAyuda}</p>
                        <ul className="flex flex-col gap-2">
                            {inactivos.map((i) => (
                                <FilaInactiva key={i.id} nombre={i.nombre} ocupado={ocupado} onActivar={() => void ejecutar(() => cambiarActivo(i.id, true)).then(avisarFalla)} />
                            ))}
                        </ul>
                    </details>
                ) : null}
            </section>
        </div>
    );
};

export default CatalogoConfig;
