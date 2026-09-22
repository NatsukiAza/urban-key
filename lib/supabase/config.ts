const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. Copiá .env.example a .env.local y completá los valores del dashboard de Supabase (Project Settings → API), después reiniciá `npm run dev`.');
}

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;
