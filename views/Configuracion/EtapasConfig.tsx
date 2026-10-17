'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { showToast, toastExito } from '@/lib/ui/toast';
import { modalDesactivar, modalNombre } from '@/lib/ui/modales';
import { estadoOportunidadConfig } from '@/lib/enums/estadoOportunidad';
import { cambiarActivoEtapa, crearEtapa, renombrarEtapa, reordenarEtapas } from '@/lib/configuracion/actions';
import type { EmbudosConfig, EtapaConfig } from '@/lib/configuracion/types';
import type { ActionResult } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import FunnelTabs from '@/components/ui/FunnelTabs';
import EstadoChip from '@/components/ui/EstadoChip';
import EstadoPantalla from '@/components/ui/EstadoPantalla';
import { FilaConfig, FilaInactiva } from '@/components/ui/FilaConfig';
import IconPlus from '@/components/Icon/IconPlus';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';

const ReactSortable = dynamic(() => import('react-sortablejs').then((mod) => mod.ReactSortable), { ssr: false });

interface Props {
    config: EmbudosConfig;
    funnelActivoId: string;
}

const claseSeccion = 'flex flex-col gap-3.5 rounded-[14px] border border-uk-line bg-white px-6 pb-6 pt-5 shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:border-[#232C45] dark:bg-uk-card-dark dark:shadow-none';

const textoAbiertas = (n: number) => (n === 0 ? 'Sin abiertas' : n === 1 ? '1 abierta' : `${n} abiertas`);

const Manija = ({ etapa, onMover }: { etapa: EtapaConfig; onMover: (id: string, delta: -1 | 1) => void }) => (
    <button
        type="button"
        data-manija={etapa.id}
        aria-label={`Reordenar ${etapa.nombre}`}
        aria-keyshortcuts="ArrowUp ArrowDown"
        title="Arrastrar, o usar ↑ ↓ con el teclado"
        onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                onMover(etapa.id, e.key === 'ArrowUp' ? -1 : 1);
            }
        }}
        className="etapa-handle grid h-11 w-11 shrink-0 cursor-grab place-content-center rounded-lg text-[#8E91A6] hover:bg-uk-page focus-visible:ring-2 focus-visible:ring-primary/40 active:cursor-grabbing dark:text-uk-muted-dark dark:hover:bg-white/5 dark:focus-visible:ring-gold/50"
    >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            {[7, 12, 17].flatMap((y) => [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
        </svg>
    </button>
);

const EtapasConfig = ({ config, funnelActivoId }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Configuración de embudos'));
    });

    const delFunnel = config.etapas.filter((e) => e.funnelId === funnelActivoId);
    const abiertasServidor = delFunnel.filter((e) => e.resultado === 'ABIERTA' && e.activo);
    const inactivas = delFunnel.filter((e) => e.resultado === 'ABIERTA' && !e.activo);
    const cierre = delFunnel.filter((e) => e.resultado !== 'ABIERTA');
    const nombresDelFunnel = delFunnel.map((e) => e.nombre);

    const [abiertas, setAbiertas] = useState<EtapaConfig[]>(abiertasServidor);
    const [ocupado, setOcupado] = useState(false);
    // Resincroniza con el servidor después de cada router.refresh().
    const clave = abiertasServidor.map((e) => `${e.id}:${e.orden}:${e.nombre}:${e.oportunidadesAbiertas}`).join('|');
    const [claveAnterior, setClaveAnterior] = useState(clave);
    if (clave !== claveAnterior) {
        setClaveAnterior(clave);
        setAbiertas(abiertasServidor);
    }

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

    const nueva = async () => {
        const nombre = await modalNombre({ titulo: 'Nueva etapa', etiqueta: 'Nombre de la etapa', placeholder: 'Ej.: Visita', confirmar: 'Crear etapa', existentes: nombresDelFunnel });
        if (!nombre) return;
        avisarFalla(await ejecutar(() => crearEtapa({ funnelId: funnelActivoId, nombre })));
    };

    const desactivar = async (etapa: EtapaConfig) => {
        const ok = await modalDesactivar({ titulo: `¿Desactivar ${etapa.nombre}?`, texto: 'Ya no va a aparecer en el tablero. Las oportunidades que pasaron por ella conservan su historial.' });
        if (ok) avisarFalla(await ejecutar(() => cambiarActivoEtapa(etapa.id, false)));
    };

    const guardarOrden = async (nuevas: EtapaConfig[]) => {
        const ids = [...nuevas, ...inactivas].map((e) => e.id);
        avisarFalla(await ejecutar(() => reordenarEtapas({ funnelId: funnelActivoId, etapaIds: ids })));
    };

    const alReordenar = (nuevas: EtapaConfig[]) => {
        const cambio = nuevas.some((e, i) => e.id !== abiertas[i]?.id);
        setAbiertas(nuevas);
        if (cambio) void guardarOrden(nuevas);
    };

    const moverConTeclado = (id: string, delta: -1 | 1) => {
        const i = abiertas.findIndex((e) => e.id === id);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= abiertas.length) return;
        const nuevas = [...abiertas];
        [nuevas[i], nuevas[j]] = [nuevas[j], nuevas[i]];
        setAbiertas(nuevas);
        void guardarOrden(nuevas);
        requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-manija="${id}"]`)?.focus());
    };

    if (config.error) {
        return (
            <div>
                <PageHeader title="Configuración de embudos" description="Las etapas no se borran: se desactivan, así las oportunidades y su historial se conservan." />
                <EstadoPantalla
                    variante="error"
                    icono={<IconInfoTriangle className="h-7 w-7" />}
                    titulo="No pudimos cargar los embudos"
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
        <div className="mx-auto flex max-w-[1080px] flex-col gap-5">
            <PageHeader
                title="Configuración de embudos"
                description="Las etapas no se borran: se desactivan, así las oportunidades y su historial se conservan."
                actions={
                    <button type="button" className="btn btn-primary h-[42px] gap-2 rounded-[10px]" disabled={ocupado || !funnelActivoId} onClick={nueva}>
                        <IconPlus />
                        Nueva etapa
                    </button>
                }
            />

            <FunnelTabs tabs={config.funnels} activeId={funnelActivoId} onSelect={(id) => router.push(`/configuracion/embudos?funnel=${id}`)} ariaLabel="Funnel" />

            <section className={claseSeccion}>
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-base font-extrabold text-uk-ink dark:text-uk-ink-dark">Etapas abiertas</h2>
                    <p className="text-[13px] text-uk-muted dark:text-uk-muted-dark">Arrastrá desde ⠿ para cambiar el orden del tablero. Tocá un nombre para renombrarlo.</p>
                </div>
                {abiertas.length === 0 ? (
                    <EstadoPantalla
                        variante="vacio"
                        icono={<IconPlus className="h-7 w-7" />}
                        titulo="Este funnel no tiene etapas abiertas"
                        descripcion="Creá la primera para que las oportunidades tengan por dónde avanzar."
                        acciones={
                            <button type="button" className="btn btn-primary h-10 rounded-[10px]" onClick={nueva}>
                                Nueva etapa
                            </button>
                        }
                    />
                ) : (
                    <ReactSortable tag="ol" list={abiertas} setList={alReordenar} handle=".etapa-handle" animation={200} disabled={ocupado} className="flex flex-col gap-2">
                        {abiertas.map((e, i) => (
                            <FilaConfig
                                key={e.id}
                                nombre={e.nombre}
                                existentes={nombresDelFunnel.filter((n) => n !== e.nombre)}
                                mensajeDuplicado="Ya hay una etapa con ese nombre en este funnel. Elegí otro."
                                onGuardar={(nombre) => ejecutar(() => renombrarEtapa(e.id, nombre))}
                                ocupado={ocupado}
                                izquierda={
                                    <>
                                        <Manija etapa={e} onMover={moverConTeclado} />
                                        <span className="w-6 text-[13px] font-bold tabular-nums text-uk-muted dark:text-uk-muted-dark">{i + 1}</span>
                                    </>
                                }
                                derecha={
                                    e.oportunidadesAbiertas > 0 ? (
                                        <span className="mr-2 rounded-full bg-primary-light px-2 py-0.5 text-xs font-bold text-primary dark:bg-uk-link-dark/[.12] dark:text-uk-link-dark">{textoAbiertas(e.oportunidadesAbiertas)}</span>
                                    ) : (
                                        <span className="px-2 text-xs text-uk-muted dark:text-uk-muted-dark max-sm:hidden">{textoAbiertas(0)}</span>
                                    )
                                }
                                desactivar={{
                                    deshabilitado: e.oportunidadesAbiertas > 0,
                                    descripcion: e.oportunidadesAbiertas > 0 ? `Tiene ${textoAbiertas(e.oportunidadesAbiertas)}: ${e.oportunidadesAbiertas === 1 ? 'movela' : 'movelas'} antes de desactivarla.` : 'Deja de aparecer en el tablero.',
                                    onClick: () => void desactivar(e),
                                }}
                            />
                        ))}
                    </ReactSortable>
                )}

                {inactivas.length > 0 ? (
                    <details className="border-t border-uk-col pt-3 dark:border-[#232C45]">
                        <summary className="cursor-pointer py-1.5 text-[13px] font-extrabold text-uk-muted dark:text-uk-muted-dark">Desactivadas ({inactivas.length})</summary>
                        <p className="mb-2.5 mt-1 text-xs text-uk-muted dark:text-uk-muted-dark">No aparecen en el tablero, pero se conservan en el historial de las oportunidades que pasaron por ellas.</p>
                        <ul className="flex flex-col gap-2">
                            {inactivas.map((e) => (
                                <FilaInactiva key={e.id} nombre={e.nombre} ocupado={ocupado} onActivar={() => void ejecutar(() => cambiarActivoEtapa(e.id, true)).then(avisarFalla)} />
                            ))}
                        </ul>
                    </details>
                ) : null}
            </section>

            <section className={claseSeccion}>
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-base font-extrabold text-uk-ink dark:text-uk-ink-dark">Etapas de cierre</h2>
                    <p className="text-[13px] text-uk-muted dark:text-uk-muted-dark">Siempre van al final del tablero. Se pueden renombrar, pero no desactivar.</p>
                </div>
                <ul className="flex flex-col gap-2">
                    {cierre.map((e) => (
                        <FilaConfig
                            key={e.id}
                            nombre={e.nombre}
                            soloLapiz
                            ocupado={ocupado}
                            existentes={nombresDelFunnel.filter((n) => n !== e.nombre)}
                            mensajeDuplicado="Ya hay una etapa con ese nombre en este funnel. Elegí otro."
                            onGuardar={(nombre) => ejecutar(() => renombrarEtapa(e.id, nombre))}
                            antes={<EstadoChip label={estadoOportunidadConfig[e.resultado].label} color={estadoOportunidadConfig[e.resultado].color} />}
                        />
                    ))}
                </ul>
            </section>
        </div>
    );
};

export default EtapasConfig;
