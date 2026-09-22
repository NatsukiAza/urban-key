import { z } from 'zod';

const numeroOpcional = (mensaje: string, { min = 0, entero = false }: { min?: number; entero?: boolean } = {}) =>
    z
        .union([z.literal(''), z.coerce.number()])
        .nullish()
        .transform((v) => (v === '' || v === undefined ? null : v))
        .refine((v) => v === null || v >= min, mensaje)
        .refine((v) => v === null || !entero || Number.isInteger(v), 'Tiene que ser un número entero');

const textoOpcional = () =>
    z
        .string()
        .trim()
        .nullish()
        .transform((v) => v || null);

export const inmuebleSchema = z
    .object({
        contactoId: z.string().min(1, 'El propietario es obligatorio'),
        nombre: textoOpcional(),
        direccion: z.string().trim().min(1, 'La dirección es obligatoria'),
        localidad: textoOpcional(),
        tipoOperacion: z.enum(['VENTA', 'ALQUILER']),
        tipoInmueble: z.enum(['CASA', 'DEPARTAMENTO', 'PH']),
        estado: z.enum(['DISPONIBLE', 'RESERVADO', 'OPERADO', 'RETIRADO']),
        ambientes: numeroOpcional('Los ambientes tienen que ser mayores a 0', { min: 1, entero: true }),
        dormitorios: numeroOpcional('Los dormitorios tienen que ser mayores a 0', { min: 1, entero: true }),
        banos: numeroOpcional('Los baños no pueden ser negativos', { min: 0, entero: true }),
        m2: numeroOpcional('La superficie tiene que ser mayor a 0', { min: 0.01 }),
        cochera: z.boolean(),
        antiguedad: numeroOpcional('La antigüedad no puede ser negativa', { min: 0, entero: true }),
        precio: numeroOpcional('El precio no puede ser negativo', { min: 0 }),
        moneda: z.enum(['ARS', 'USD']),
        expensas: numeroOpcional('Las expensas no pueden ser negativas', { min: 0 }),
        descripcion: textoOpcional(),
    })
    .refine((d) => d.dormitorios === null || d.ambientes === null || d.dormitorios <= d.ambientes, {
        message: 'Los dormitorios no pueden superar la cantidad de ambientes',
        path: ['dormitorios'],
    });

export type InmuebleSchemaInput = z.input<typeof inmuebleSchema>;
export type InmuebleSchemaOutput = z.output<typeof inmuebleSchema>;
