import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('admin_auth');
  const { pathname } = request.nextUrl;

  // Εξαιρέσεις για να μην κολλάει το login και τα αρχεία του συστήματος
  if (pathname.startsWith('/login') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};