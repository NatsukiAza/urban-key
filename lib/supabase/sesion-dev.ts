import type { SupabaseClient } from '@supabase/supabase-js';

export function sesionDevHabilitada(): boolean {
    return process.env.NODE_ENV !== 'production' && Boolean(process.env.DEV_USER_EMAIL) && Boolean(process.env.DEV_USER_PASSWORD);
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
    console.log(`[sesión dev] Sesión abierta como ${process.env.DEV_USER_EMAIL}. Este atajo no corre en producción.`);
}
