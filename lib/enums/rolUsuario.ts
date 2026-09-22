export type RolUsuario = 'ADMINISTRADOR' | 'VENDEDOR' | 'RESPONSABLE_COMERCIAL';

export const rolUsuarioOptions: { label: string; value: RolUsuario }[] = [
    { label: 'Administrador', value: 'ADMINISTRADOR' },
    { label: 'Vendedor', value: 'VENDEDOR' },
    { label: 'Responsable comercial', value: 'RESPONSABLE_COMERCIAL' },
];

export const rolUsuarioConfig: Record<RolUsuario, { label: string; color: string }> = {
    ADMINISTRADOR: { label: 'Administrador', color: 'primary' },
    VENDEDOR: { label: 'Vendedor', color: 'info' },
    RESPONSABLE_COMERCIAL: { label: 'Responsable comercial', color: 'success' },
};
