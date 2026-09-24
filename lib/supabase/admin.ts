import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { SUPABASE_URL } from './config';

export function createServiceClient() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
        throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.');
    }

    return createClient<Database>(SUPABASE_URL, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
