import 'server-only';
import { createClient } from '../supabase/server';
import { aFunnel } from '../mapeo';
import type { EmbudosConfig, EtapaConfig, MotivoPerdidaConfig } from './types';

export async function getEmbudosConfig(): Promise<EmbudosConfig> {
    try {
        const supabase = await createClient();
        const [funnels, etapas, abiertas] = await Promise.all([
            supabase.from('funnels').select('*').eq('activo', true).order('nombre'),
            supabase.from('etapas').select('*').order('orden'),
            supabase.from('oportunidades').select('etapa_id').eq('estado', 'ABIERTA').eq('activo', true),
        ]);

        const primerError = [funnels, etapas, abiertas].find((r) => r.error)?.error;
        if (primerError) throw primerError;

        const porEtapa = new Map<string, number>();
        for (const o of abiertas.data ?? []) porEtapa.set(o.etapa_id, (porEtapa.get(o.etapa_id) ?? 0) + 1);

        return {
            funnels: (funnels.data ?? []).map(aFunnel),
            etapas: (etapas.data ?? []).map(
                (e): EtapaConfig => ({
                    id: e.id,
                    funnelId: e.funnel_id,
                    nombre: e.nombre,
                    orden: e.orden,
                    resultado: e.resultado,
                    activo: e.activo,
                    oportunidadesAbiertas: porEtapa.get(e.id) ?? 0,
                }),
            ),
        };
    } catch (err) {
        console.error('Error getEmbudosConfig', err);
        return { funnels: [], etapas: [] };
    }
}

export async function getMotivosPerdidaConfig(): Promise<MotivoPerdidaConfig[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('motivos_perdida').select('*').order('nombre');
        if (error) throw error;
        return (data ?? []).map((m) => ({ id: m.id, nombre: m.nombre, activo: m.activo }));
    } catch (err) {
        console.error('Error getMotivosPerdidaConfig', err);
        return [];
    }
}
