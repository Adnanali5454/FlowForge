import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forms',       // public form viewer
  '/api/auth',    // auth endpoints
  '/api/webhooks', // incoming webhooks (no auth needed)
  '/api/oauth',   // oauth callbacks
  '/_next',
  '/favicon',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (isPublic(pathname)) return NextResponse.next();

  // Allow the landing page
  if (pathname === '/') return NextResponse.next();

  const token = request.cookies.get('ff_session')?.value;

  // No token → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-dev-secret'
    );
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Invalid/expired token → clear cookie and redirect
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('ff_session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and api routes that handle their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
