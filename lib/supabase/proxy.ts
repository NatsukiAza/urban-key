import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';
import { iniciarSesionDev, sesionDevHabilitada } from './sesion-dev';

export async function actualizarSesion(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet, headers) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
                Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
            },
        },
    });

    try {
        const { data } = await supabase.auth.getUser();

        if (!data.user && sesionDevHabilitada()) {
            await iniciarSesionDev(supabase);
        }
    } catch (err) {
        console.error('Error refrescando la sesión de Supabase', err);
    }

    return response;
}
