import type { RolUsuario } from '../enums/rolUsuario';

export const puedeReasignar = (rol: RolUsuario | null | undefined) => rol === 'ADMINISTRADOR' || rol === 'RESPONSABLE_COMERCIAL';
