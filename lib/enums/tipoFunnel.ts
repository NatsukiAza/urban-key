export type TipoFunnel = 'CAPTACION_VENTA' | 'CAPTACION_ALQUILER' | 'INTERESADOS_COMPRA' | 'INTERESADOS_ALQUILER';

export const tipoFunnelOptions: { label: string; value: TipoFunnel }[] = [
    { label: 'Captación Venta', value: 'CAPTACION_VENTA' },
    { label: 'Captación Alquiler', value: 'CAPTACION_ALQUILER' },
    { label: 'Interesados Compra', value: 'INTERESADOS_COMPRA' },
    { label: 'Interesados Alquiler', value: 'INTERESADOS_ALQUILER' },
];

export const tipoFunnelConfig: Record<TipoFunnel, { label: string; color: string }> = {
    CAPTACION_VENTA: { label: 'Captación Venta', color: 'primary' },
    CAPTACION_ALQUILER: { label: 'Captación Alquiler', color: 'secondary' },
    INTERESADOS_COMPRA: { label: 'Interesados Compra', color: 'success' },
    INTERESADOS_ALQUILER: { label: 'Interesados Alquiler', color: 'warning' },
};
