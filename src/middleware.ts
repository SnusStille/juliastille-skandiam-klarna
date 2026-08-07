import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/logga-in', '/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (!session && !isPublic) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Ej inloggad.' },
        { status: 401 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = '/logga-in';
    url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (session && pathname === '/logga-in') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Alla sidor och API-rutter skyddas, utom Next.js interna filer
    // och de publika bildfilerna i /public.
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|icon.svg|login-bg.jpg|objekt/[^/]+\\.(?:jpg|jpeg|png|webp|avif|svg)).*)',
  ],
};
