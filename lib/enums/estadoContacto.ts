export type EstadoContacto = 'POTENCIAL' | 'CLIENTE' | 'INACTIVO' | 'NO_CONTACTAR';

export const estadoContactoOptions: { label: string; value: EstadoContacto }[] = [
    { label: 'Potencial', value: 'POTENCIAL' },
    { label: 'Cliente', value: 'CLIENTE' },
    { label: 'Inactivo', value: 'INACTIVO' },
    { label: 'No contactar', value: 'NO_CONTACTAR' },
];

export const estadoContactoConfig: Record<EstadoContacto, { label: string; color: string }> = {
    POTENCIAL: { label: 'Potencial', color: 'info' },
    CLIENTE: { label: 'Cliente', color: 'success' },
    INACTIVO: { label: 'Inactivo', color: 'secondary' },
    NO_CONTACTAR: { label: 'No contactar', color: 'danger' },
};
