import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hasToken = request.cookies.has('refresh_token');

    console.log(`[PROXY] Path: ${pathname}, hasToken: ${hasToken}`);

    const isProtectedRoute = pathname.startsWith('/dashboard') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/agreements') ||
        pathname.startsWith('/billing') ||
        pathname.startsWith('/maintenance') ||
        pathname.startsWith('/properties') ||
        pathname.startsWith('/renters') ||
        pathname.startsWith('/units');

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

    if (isProtectedRoute && !hasToken) {
        console.log(`[PROXY] Redirecting to /login (Protected route, no token)`);
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthRoute && hasToken) {
        // We no longer aggressively redirect to dashboard here to avoid loops
        // if the client-side session is missing.
        console.log(`[PROXY] At auth route with token, allowing through.`);
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};