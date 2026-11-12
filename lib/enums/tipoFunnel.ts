export type TipoFunnel = 'PROPIETARIOS' | 'INTERESADOS_COMPRA' | 'INTERESADOS_ALQUILER';

export const tipoFunnelOptions: { label: string; value: TipoFunnel }[] = [
    { label: 'Propietarios', value: 'PROPIETARIOS' },
    { label: 'Interesados Compra', value: 'INTERESADOS_COMPRA' },
    { label: 'Interesados Alquiler', value: 'INTERESADOS_ALQUILER' },
];

export const tipoFunnelConfig: Record<TipoFunnel, { label: string; color: string }> = {
    PROPIETARIOS: { label: 'Propietarios', color: 'primary' },
    INTERESADOS_COMPRA: { label: 'Interesados Compra', color: 'success' },
    INTERESADOS_ALQUILER: { label: 'Interesados Alquiler', color: 'warning' },
};
