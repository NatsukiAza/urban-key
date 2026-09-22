import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseEnv } from '@/lib/supabase/env';

function redirectWithSession(request: NextRequest, sessionResponse: NextResponse, pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    sessionResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
}

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });
    const { url, key } = supabaseEnv();

    const supabase = createServerClient(url, key, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value);
                });
                supabaseResponse = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => {
                    supabaseResponse.cookies.set(name, value, options);
                });
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isAuthRoute = path.startsWith('/auth');
    const isLoginOrRegister = path.startsWith('/auth/cover-login') || path.startsWith('/auth/cover-register');

    if (!user && !isAuthRoute) {
        return redirectWithSession(request, supabaseResponse, '/auth/cover-login');
    }

    if (user && isLoginOrRegister) {
        return redirectWithSession(request, supabaseResponse, '/');
    }

    return supabaseResponse;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
