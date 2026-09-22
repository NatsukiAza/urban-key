export type TipoInmueble = 'CASA' | 'DEPARTAMENTO' | 'PH';

export const tipoInmuebleOptions: { label: string; value: TipoInmueble }[] = [
    { label: 'Casa', value: 'CASA' },
    { label: 'Departamento', value: 'DEPARTAMENTO' },
    { label: 'PH', value: 'PH' },
];

export const tipoInmuebleConfig: Record<TipoInmueble, { label: string; color: string }> = {
    CASA: { label: 'Casa', color: 'primary' },
    DEPARTAMENTO: { label: 'Departamento', color: 'info' },
    PH: { label: 'PH', color: 'secondary' },
};
