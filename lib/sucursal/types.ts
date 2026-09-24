import type { RolUsuario } from '../enums/rolUsuario';

export type Inmobiliaria = {
    id: string;
    nombre: string;
    cuit: string | null;
    activo: boolean;
};

export type Sucursal = {
    id: string;
    inmobiliariaId: string;
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    activo: boolean;
};

export type UsuarioDeSucursal = {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: RolUsuario;
    activo: boolean;
    sucursalId: string | null;
    sucursalNombre: string | null;
};

export type SucursalDetalle = Sucursal & {
    usuarios: UsuarioDeSucursal[];
};
