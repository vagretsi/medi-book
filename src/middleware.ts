import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('admin_auth');
  const { pathname } = request.nextUrl;

  // Εξαιρέσεις: Μην ελέγχεις το login page και τα στατικά αρχεία
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Αν δεν είναι συνδεδεμένος, στείλτον στο login
  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};