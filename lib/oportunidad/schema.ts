import { z } from 'zod';

// Validación de forma/requeridos. Las reglas de dominio que dependen del estado o
// de relaciones (etapa↔funnel↔estado, cerrada no editable, etc.) se validan en actions.ts.

// Fecha YYYY-MM-DD opcional: vacío, null o undefined quedan en null.
const fechaOpcional = (mensaje: string) =>
    z
        .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, mensaje)])
        .nullish()
        .transform((v) => v || null);

export const oportunidadSchema = z.object({
    titulo: z.string().trim().min(1, 'El título es obligatorio'),
    contactoId: z.string().min(1, 'El interesado es obligatorio'),
    inmuebleId: z.string().nullish().transform((v) => v || null),
    responsableId: z.string().min(1, 'El responsable es obligatorio'),
    funnelId: z.string().min(1, 'El funnel es obligatorio'),
    etapaId: z.string().min(1, 'La etapa es obligatoria'),
    valorEstimado: z.coerce.number().min(0, 'El valor no puede ser negativo').nullish().transform((v) => (v === undefined ? null : v)),
    moneda: z.enum(['ARS', 'USD']).default('ARS'),
    origenId: z.string().nullish().transform((v) => v || null),
    observaciones: z.string().nullish().transform((v) => v || null),
    fechaCierreEstimada: fechaOpcional('La fecha estimada de cierre no es válida'),
});

export const cambiarEtapaSchema = z.object({
    oportunidadId: z.string().min(1),
    etapaId: z.string().min(1, 'La etapa es obligatoria'),
    observacion: z.string().nullish().transform((v) => v || null),
    motivoPerdidaId: z.string().nullish().transform((v) => v || null),
    fechaCierre: fechaOpcional('La fecha de cierre no es válida'),
    valorFinal: z.coerce.number().min(0, 'El valor final no puede ser negativo').nullish().transform((v) => (v === undefined ? null : v)),
});

export const reasignarSchema = z.object({
    oportunidadId: z.string().min(1),
    responsableId: z.string().min(1, 'El responsable es obligatorio'),
});

export type OportunidadSchemaInput = z.input<typeof oportunidadSchema>;
export type CambiarEtapaInput = z.infer<typeof cambiarEtapaSchema>;
