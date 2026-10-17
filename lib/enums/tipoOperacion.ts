export type TipoOperacion = 'VENTA' | 'ALQUILER';

export const tipoOperacionOptions: { label: string; value: TipoOperacion }[] = [
    { label: 'Venta', value: 'VENTA' },
    { label: 'Alquiler', value: 'ALQUILER' },
];

export const tipoOperacionConfig: Record<TipoOperacion, { label: string; color: string }> = {
    VENTA: { label: 'Venta', color: 'neutral' },
    ALQUILER: { label: 'Alquiler', color: 'neutral' },
};
