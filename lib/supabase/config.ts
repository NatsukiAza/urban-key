const MENSAJE =
    'Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. En local, copiá .env.example a .env.local y reiniciá `npm run dev`. En Vercel, cargalas para Production y Preview (Settings → Environment Variables) y volvé a desplegar.';

export function getSupabasePublicConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
        throw new Error(MENSAJE);
    }
    return { url, anonKey };
}
