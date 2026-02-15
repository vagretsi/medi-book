import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('admin_auth');
  const { pathname } = request.nextUrl;

  // 1. ΕΞΑΙΡΕΣΕΙΣ: Άφησε αυτά να περνάνε πάντα
  if (
    pathname.startsWith('/login') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.includes('.') // για favicon, images κτλ
  ) {
    return NextResponse.next();
  }

  // 2. ΕΛΕΓΧΟΣ: Αν ΔΕΝ έχει cookie, στείλτον στο /login
  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};