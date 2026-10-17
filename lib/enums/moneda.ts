export type Moneda = 'ARS' | 'USD';

export const monedaOptions: { label: string; value: Moneda }[] = [
    { label: 'Pesos (ARS)', value: 'ARS' },
    { label: 'Dólares (USD)', value: 'USD' },
];

export const monedaConfig: Record<Moneda, { label: string; simbolo: string; color: string }> = {
    ARS: { label: 'ARS', simbolo: '$', color: 'neutral' },
    USD: { label: 'USD', simbolo: 'US$', color: 'neutral' },
};

export const formatearImporte = (valor: number | null | undefined, moneda: Moneda = 'ARS'): string =>
    valor == null ? '—' : `${monedaConfig[moneda].simbolo} ${valor.toLocaleString('es-AR')}`;

export const formatearMonto = (valor: number, moneda: Moneda): string => `${moneda} ${valor.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
