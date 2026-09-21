export type EstadoOportunidad = 'ABIERTA' | 'GANADA' | 'PERDIDA';

export const estadoOportunidadOptions: { label: string; value: EstadoOportunidad }[] = [
    { label: 'Abierta', value: 'ABIERTA' },
    { label: 'Ganada', value: 'GANADA' },
    { label: 'Perdida', value: 'PERDIDA' },
];

export const estadoOportunidadConfig: Record<EstadoOportunidad, { label: string; color: string }> = {
    ABIERTA: { label: 'Abierta', color: 'info' },
    GANADA: { label: 'Ganada', color: 'success' },
    PERDIDA: { label: 'Perdida', color: 'danger' },
};
