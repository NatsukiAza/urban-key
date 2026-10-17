'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '@/store/themeConfigSlice';
import { showToast } from '@/lib/ui/toast';
import { estadoOportunidadConfig } from '@/lib/enums/estadoOportunidad';
import { cambiarActivoEtapa, crearEtapa, renombrarEtapa, reordenarEtapas } from '@/lib/configuracion/actions';
import type { EmbudosConfig, EtapaConfig } from '@/lib/configuracion/types';
import type { ActionResult } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import IconPlus from '@/components/Icon/IconPlus';
import IconMenu from '@/components/Icon/IconMenu';

const ReactSortable = dynamic(() => import('react-sortablejs').then((mod) => mod.ReactSortable), { ssr: false });

interface Props {
    config: EmbudosConfig;
    funnelActivoId: string;
}

async function pedirNombre(titulo: string, valorInicial = '') {
    const { value, isConfirmed } = await Swal.fire({
        title: titulo,
        input: 'text',
        inputValue: valorInicial,
        inputPlaceholder: 'Nombre',
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        padding: '2em',
        inputValidator: (v) => (!v.trim() ? 'El nombre es obligatorio' : undefined),
    });
    return isConfirmed ? (value as string).trim() : null;
}

const EtapasConfig = ({ config, funnelActivoId }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Configuración de embudos'));
    });

    const delFunnel = config.etapas.filter((e) => e.funnelId === funnelActivoId);
    const abiertasServidor = delFunnel.filter((e) => e.resultado === 'ABIERTA');
    const cierre = delFunnel.filter((e) => e.resultado !== 'ABIERTA');

    const [abiertas, setAbiertas] = useState<EtapaConfig[]>(abiertasServidor);
    const [ocupado, setOcupado] = useState(false);
    // Resincroniza con el servidor después de cada router.refresh().
    const clave = abiertasServidor.map((e) => `${e.id}:${e.orden}:${e.nombre}:${e.activo}:${e.oportunidadesAbiertas}`).join('|');
    const [claveAnterior, setClaveAnterior] = useState(clave);
    if (clave !== claveAnterior) {
        setClaveAnterior(clave);
        setAbiertas(abiertasServidor);
    }

    const ejecutar = async (accion: () => Promise<ActionResult>) => {
        setOcupado(true);
        const res = await accion();
        setOcupado(false);
        showToast(res.mensaje ?? '', res.ok ? 'success' : 'error');
        router.refresh();
    };

    const nueva = async () => {
        const nombre = await pedirNombre('Nueva etapa');
        if (nombre) await ejecutar(() => crearEtapa({ funnelId: funnelActivoId, nombre }));
    };

    const renombrar = async (etapa: EtapaConfig) => {
        const nombre = await pedirNombre('Renombrar etapa', etapa.nombre);
        if (nombre && nombre !== etapa.nombre) await ejecutar(() => renombrarEtapa(etapa.id, nombre));
    };

    const alternarActivo = async (etapa: EtapaConfig) => {
        if (etapa.activo) {
            const { isConfirmed } = await Swal.fire({
                title: '¿Desactivar la etapa?',
                text: 'No se podrán mover oportunidades a esta etapa. El historial se conserva.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Desactivar',
                cancelButtonText: 'Cancelar',
                padding: '2em',
            });
            if (!isConfirmed) return;
        }
        await ejecutar(() => cambiarActivoEtapa(etapa.id, !etapa.activo));
    };

    const alReordenar = (nuevas: EtapaConfig[]) => {
        const cambio = nuevas.some((e, i) => e.id !== abiertas[i]?.id);
        setAbiertas(nuevas);
        if (cambio) ejecutar(() => reordenarEtapas({ funnelId: funnelActivoId, etapaIds: nuevas.map((e) => e.id) }));
    };

    const fila = (etapa: EtapaConfig, posicion: number, arrastrable: boolean) => (
        <div
            key={etapa.id}
            className={`flex flex-wrap items-center gap-3 rounded-md border border-white-light bg-white px-3 py-2.5 dark:border-[#1b2e4b] dark:bg-black ${etapa.activo ? '' : 'opacity-60'}`}
        >
            {arrastrable ? (
                <span className="etapa-handle cursor-move text-white-dark" title="Arrastrar para reordenar">
                    <IconMenu className="h-4 w-4" />
                </span>
            ) : (
                <span className="w-4" />
            )}
            <span className="w-6 text-sm font-semibold text-white-dark">{posicion}</span>
            <span className="flex-1 font-medium">{etapa.nombre}</span>
            {etapa.resultado !== 'ABIERTA' && (
                <span className={`badge badge-outline-${estadoOportunidadConfig[etapa.resultado].color}`}>{estadoOportunidadConfig[etapa.resultado].label}</span>
            )}
            {!etapa.activo && <span className="badge badge-outline-secondary">Inactiva</span>}
            {etapa.resultado === 'ABIERTA' && (
                <span className="text-xs text-white-dark" title="Oportunidades abiertas en esta etapa">
                    {etapa.oportunidadesAbiertas} abierta(s)
                </span>
            )}
            <div className="flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-primary" disabled={ocupado} onClick={() => renombrar(etapa)}>
                    Renombrar
                </button>
                {etapa.resultado === 'ABIERTA' && (
                    <button
                        type="button"
                        className={`btn btn-sm ${etapa.activo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        disabled={ocupado || (etapa.activo && etapa.oportunidadesAbiertas > 0)}
                        title={etapa.activo && etapa.oportunidadesAbiertas > 0 ? 'Mové sus oportunidades abiertas antes de desactivarla' : undefined}
                        onClick={() => alternarActivo(etapa)}
                    >
                        {etapa.activo ? 'Desactivar' : 'Activar'}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <PageHeader
                title="Configuración de embudos"
                description="Las etapas no se borran: se desactivan, así las oportunidades y su historial se conservan."
                actions={
                    <button type="button" className="btn btn-primary gap-2" disabled={ocupado || !funnelActivoId} onClick={nueva}>
                        <IconPlus className="h-4 w-4" />
                        Nueva etapa
                    </button>
                }
            />

            <div className="mb-5 flex flex-wrap gap-2">
                {config.funnels.map((f) => (
                    <Link
                        key={f.id}
                        href={`/configuracion/embudos?funnel=${f.id}`}
                        className={`btn btn-sm ${f.id === funnelActivoId ? 'btn-primary' : 'btn-outline-primary'}`}
                        aria-current={f.id === funnelActivoId ? 'page' : undefined}
                    >
                        {f.nombre}
                    </Link>
                ))}
            </div>

            <div className="panel space-y-5">
                <div>
                    <h2 className="mb-1 text-base font-semibold">Etapas abiertas</h2>
                    <p className="mb-3 text-sm text-white-dark">Arrastrá para cambiar el orden en que aparecen en el tablero.</p>
                    <ReactSortable
                        list={abiertas}
                        setList={alReordenar}
                        handle=".etapa-handle"
                        animation={200}
                        disabled={ocupado}
                        className="space-y-2"
                    >
                        {abiertas.map((e, i) => fila(e, i + 1, true))}
                    </ReactSortable>
                    {abiertas.length === 0 && <p className="text-sm text-white-dark">Este funnel no tiene etapas abiertas.</p>}
                </div>

                <div>
                    <h2 className="mb-1 text-base font-semibold">Etapas de cierre</h2>
                    <p className="mb-3 text-sm text-white-dark">Siempre van al final. Se pueden renombrar, pero no desactivar.</p>
                    <div className="space-y-2">{cierre.map((e, i) => fila(e, abiertas.length + i + 1, false))}</div>
                </div>
            </div>
        </div>
    );
};

export default EtapasConfig;
