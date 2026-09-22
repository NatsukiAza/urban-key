export type EstadoInmueble = 'DISPONIBLE' | 'RESERVADO' | 'OPERADO' | 'RETIRADO';

export const estadoInmuebleOptions: { label: string; value: EstadoInmueble }[] = [
    { label: 'Disponible', value: 'DISPONIBLE' },
    { label: 'Reservado', value: 'RESERVADO' },
    { label: 'Operado', value: 'OPERADO' },
    { label: 'Retirado', value: 'RETIRADO' },
];

export const estadoInmuebleConfig: Record<EstadoInmueble, { label: string; color: string }> = {
    DISPONIBLE: { label: 'Disponible', color: 'success' },
    RESERVADO: { label: 'Reservado', color: 'warning' },
    OPERADO: { label: 'Operado', color: 'info' },
    RETIRADO: { label: 'Retirado', color: 'dark' },
};
