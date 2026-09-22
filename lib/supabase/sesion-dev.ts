import type { SupabaseClient } from '@supabase/supabase-js';

const enProduccion = () => process.env.NODE_ENV === 'production';

export function sesionDevHabilitada(): boolean {
    if (!process.env.DEV_USER_EMAIL || !process.env.DEV_USER_PASSWORD) return false;
    if (!enProduccion()) return true;

    return process.env.PERMITIR_SESION_DEMO === '1';
}

let proximoIntento = 0;

export async function iniciarSesionDev(supabase: SupabaseClient): Promise<void> {
    if (Date.now() < proximoIntento) return;

    const { error } = await supabase.auth.signInWithPassword({
        email: process.env.DEV_USER_EMAIL as string,
        password: process.env.DEV_USER_PASSWORD as string,
    });

    if (error) {
        proximoIntento = Date.now() + 30_000;
        console.error(`[sesión dev] No se pudo iniciar sesión: ${error.message}. Revisá DEV_USER_EMAIL y DEV_USER_PASSWORD en .env.local, y que el usuario exista y esté confirmado en Authentication → Users.`);
        return;
    }

    proximoIntento = 0;

    if (enProduccion()) {
        console.warn(`[sesión demo] ATENCIÓN: sesión automática como ${process.env.DEV_USER_EMAIL} en producción (PERMITIR_SESION_DEMO=1). Todo visitante del deploy es este usuario. Borrá la variable cuando esté el login real.`);
        return;
    }

    console.log(`[sesión dev] Sesión abierta como ${process.env.DEV_USER_EMAIL}.`);
}
