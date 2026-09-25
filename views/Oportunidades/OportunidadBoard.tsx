'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '@/store/themeConfigSlice';
import { cambiarEtapa } from '@/lib/oportunidad/actions';
import { showToast } from '@/lib/ui/toast';
import { estadoOportunidadConfig } from '@/lib/enums/estadoOportunidad';
import { formatearImporte } from '@/lib/enums/moneda';
import type { ColumnaEtapa } from '@/lib/oportunidad/types';
import type { Funnel, MotivoPerdida } from '@/lib/dominio';
import type { EstadoOportunidad } from '@/lib/enums/estadoOportunidad';
import { inicialesDe } from '@/components/ui/Iniciales';
import PageHeader from '@/components/ui/PageHeader';

const ReactSortable = dynamic(() => import('react-sortablejs').then((mod) => mod.ReactSortable), { ssr: false });

interface Props {
    columnas: ColumnaEtapa[];
    funnels: Funnel[];
    activeFunnelId: string;
    motivosPerdida: MotivoPerdida[];
}

const OportunidadBoard = ({ columnas, funnels, activeFunnelId, motivosPerdida }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    useEffect(() => {
        dispatch(setPageTitle('Tablero de oportunidades'));
    });

    const [columns, setColumns] = useState<ColumnaEtapa[]>(columnas);
    useEffect(() => {
        setColumns(columnas);
    }, [columnas]);

    const showMessage = (msg = '', type: any = 'success') => showToast(msg, type);

    const cambiarFunnel = (funnelId: string) => {
        router.push(`/oportunidades/tablero?funnel=${funnelId}`);
    };

    const aplicarMovimiento = async (cardId: string, destEtapaId: string) => {
        const destCol = columns.find((c) => c.id === destEtapaId);
        let motivoPerdidaId: string | null = null;
        if (destCol?.resultado === 'PERDIDA') {
            const opciones = motivosPerdida.reduce((acc: Record<string, string>, m) => ({ ...acc, [m.id]: m.nombre }), {});
            const { value, isConfirmed } = await Swal.fire({
                title: 'Motivo de pérdida',
                input: 'select',
                inputOptions: opciones,
                inputPlaceholder: 'Seleccionar motivo',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                inputValidator: (v) => (!v ? 'Tenés que elegir un motivo' : undefined),
            });
            if (!isConfirmed) {
                router.refresh(); // revierte el movimiento optimista
                return;
            }
            motivoPerdidaId = value;
        }
        const res = await cambiarEtapa({ oportunidadId: cardId, etapaId: destEtapaId, motivoPerdidaId });
        showMessage(res.mensaje, res.ok ? 'success' : 'error');
        router.refresh(); // reconcilia con el store (revierte movimientos rechazados)
    };

    const abiertas = columns.filter((column) => column.resultado === 'ABIERTA');
    const cierre = columns.filter((column) => column.resultado !== 'ABIERTA');

    const tonoColumna = (resultado: EstadoOportunidad) => {
        if (resultado === 'GANADA') return 'border-t-4 border-t-success bg-success/[0.06]';
        if (resultado === 'PERDIDA') return 'border-t-4 border-t-danger bg-danger/[0.06]';
        return 'border-t-4 border-t-primary bg-primary/[0.04]';
    };

    const tonoTarjeta = (resultado: EstadoOportunidad) => {
        if (resultado === 'GANADA') return 'border-l-success';
        if (resultado === 'PERDIDA') return 'border-l-danger';
        return 'border-l-gold';
    };

    const columna = (column: ColumnaEtapa) => (
        <div key={column.id} className={`panel w-80 flex-none ${tonoColumna(column.resultado)}`} data-group={column.id}>
            <div className="flex justify-between mb-5">
                <h4 className="text-base font-semibold flex items-center gap-2">
                    {column.title}
                    {column.resultado !== 'ABIERTA' && <span className={`badge badge-outline-${estadoOportunidadConfig[column.resultado].color}`}>{estadoOportunidadConfig[column.resultado].label}</span>}
                </h4>
                <span className="badge bg-primary/10 text-primary">{column.tasks.length}</span>
            </div>
            <ReactSortable
                list={column.tasks}
                setList={(newState: any, sortable: any) => {
                    if (!sortable) return;
                    const destId = sortable.el.closest('[data-group]')?.getAttribute('data-group') || column.id;
                    const before = columns.find((c) => c.id === destId);
                    const beforeIds = new Set(before ? before.tasks.map((t) => t.id) : []);
                    const entrante = newState.find((t: any) => !beforeIds.has(t.id));
                    setColumns((cols) => cols.map((c) => (c.id === destId ? { ...c, tasks: newState } : c)));
                    if (entrante) {
                        aplicarMovimiento(entrante.id, destId);
                    }
                }}
                animation={200}
                group={{ name: 'oportunidades', pull: true, put: true }}
                ghostClass="sortable-ghost"
                dragClass="sortable-drag"
                className="connect-sorting-content min-h-[150px]"
            >
                {column.tasks.map((task) => (
                    <div className="sortable-list" key={task.id}>
                        <div
                            onClick={() => router.push(`/oportunidades/${task.id}`)}
                            className={`mb-3 cursor-move select-none space-y-2 rounded-md border border-white-light bg-white p-3 shadow-sm ltr:border-l-4 dark:border-[#1b2e4b] dark:bg-black ${tonoTarjeta(column.resultado)}`}
                        >
                            <div className="text-base font-medium">{task.titulo}</div>
                            <div className="text-sm text-white-dark">{task.contacto}</div>
                            {task.inmueble && <div className="text-xs text-white-dark">{task.inmueble}</div>}
                            <div className="flex items-center justify-between gap-2 pt-1">
                                <span className="text-sm font-semibold text-gold-dark">{task.valorEstimado != null ? formatearImporte(task.valorEstimado, task.moneda) : ''}</span>
                                <span className="grid h-7 w-7 shrink-0 place-content-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary" title={task.responsable}>
                                    {inicialesDe(task.responsable)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </ReactSortable>
        </div>
    );

    return (
        <div className="flex h-[calc(100dvh-10rem)] flex-col">
            <PageHeader title="Tablero de oportunidades" description="Arrastrá una tarjeta para cambiar de etapa." />
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <div className="flex items-center gap-2">
                    <label htmlFor="funnel" className="mb-0">
                        Funnel:
                    </label>
                    <select id="funnel" className="form-select w-64" value={activeFunnelId} onChange={(e) => cambiarFunnel(e.target.value)}>
                        {funnels.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <Link href="/oportunidades" className="btn btn-outline-primary">
                    Ver lista
                </Link>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
                <div className="flex items-start flex-nowrap gap-5 pb-2">
                    {abiertas.map(columna)}
                    {cierre.length > 0 && <div className="flex-none self-stretch border-l border-white-light dark:border-[#1b2e4b]" />}
                    {cierre.map(columna)}
                </div>
            </div>
        </div>
    );
};

export default OportunidadBoard;
