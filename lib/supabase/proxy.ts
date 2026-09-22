import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';
import { iniciarSesionDev, sesionDevHabilitada } from './sesion-dev';

function redirigirConSesion(request: NextRequest, response: NextResponse, pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
}

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

    let user: User | null = null;
    try {
        ({ data: { user } } = await supabase.auth.getUser());

        if (!user && sesionDevHabilitada()) {
            await iniciarSesionDev(supabase);
            ({ data: { user } } = await supabase.auth.getUser());
        }
    } catch (err) {
        console.error('Error refrescando la sesión de Supabase', err);
    }

    const path = request.nextUrl.pathname;
    const esRutaAuth = path.startsWith('/auth');
    const esLoginORegistro = path.startsWith('/auth/cover-login') || path.startsWith('/auth/cover-register');

    if (!user && !esRutaAuth) {
        return redirigirConSesion(request, response, '/auth/cover-login');
    }

    if (user && esLoginORegistro) {
        return redirigirConSesion(request, response, '/');
    }

    return response;
}
