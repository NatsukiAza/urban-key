import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getSupabasePublicConfig } from './config';

export function createServiceClient() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
        throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.');
    }

    const { url } = getSupabasePublicConfig();
    return createClient<Database>(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
