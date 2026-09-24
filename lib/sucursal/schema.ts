import { z } from 'zod';

const textoOpcional = () =>
    z
        .string()
        .trim()
        .nullish()
        .transform((v) => v || null);

export const inmobiliariaSchema = z.object({
    nombre: z.string().trim().min(1, 'El nombre de la inmobiliaria es obligatorio'),
    cuit: textoOpcional(),
});

export const sucursalSchema = z.object({
    nombre: z.string().trim().min(1, 'El nombre de la sucursal es obligatorio'),
    direccion: textoOpcional(),
    telefono: textoOpcional(),
    activo: z.boolean().optional(),
});

export type InmobiliariaInput = z.infer<typeof inmobiliariaSchema>;
export type SucursalInput = z.infer<typeof sucursalSchema>;
