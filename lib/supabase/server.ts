import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from './config';
import type { Database } from '@/types/database';

export async function createClient() {
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabasePublicConfig();

    return createServerClient<Database>(url, anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                } catch {
                }
            },
        },
    });
}
