import { z } from 'zod';

export const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;

const textoOpcional = (max: number, mensaje: string) =>
    z
        .string()
        .trim()
        .max(max, mensaje)
        .nullish()
        .transform((v) => v || null);

export const vinculoSchema = z.object({
    tipo: z.enum(['contacto', 'inmueble', 'oportunidad']),
    id: z.uuid('Registro inválido'),
});

export const actividadSchema = z.object({
    vinculo: vinculoSchema,
    tipoId: z.uuid('Elegí un tipo de actividad'),
    titulo: textoOpcional(120, 'El título no puede superar los 120 caracteres'),
    descripcion: textoOpcional(2000, 'La descripción no puede superar los 2000 caracteres'),
    fecha: z
        .string()
        .refine((v) => !Number.isNaN(Date.parse(v)), 'Elegí la fecha y la hora en que ocurrió')
        .refine((v) => Date.parse(v) <= Date.now() + TOLERANCIA_FUTURO_MS, 'La actividad ya tiene que haber ocurrido: la fecha no puede ser futura'),
});

export type ActividadSchemaOutput = z.output<typeof actividadSchema>;
