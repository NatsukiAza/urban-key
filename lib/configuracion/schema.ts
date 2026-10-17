import { z } from 'zod';

export const nombreConfigSchema = z.string().trim().min(1, 'El nombre es obligatorio').max(60, 'El nombre no puede superar los 60 caracteres');

export const nuevaEtapaSchema = z.object({
    funnelId: z.uuid('Funnel inválido'),
    nombre: nombreConfigSchema,
});

export const reordenarEtapasSchema = z.object({
    funnelId: z.uuid('Funnel inválido'),
    etapaIds: z.array(z.uuid()).min(1, 'No hay etapas para ordenar'),
});
