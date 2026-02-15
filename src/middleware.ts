import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('admin_auth');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Αν δεν έχει cookie και δεν είναι στη σελίδα login, στείλτον στο login
  if (!authCookie && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Αν είναι ήδη συνδεδεμένος και πάει στο login, στείλτον στο dashboard
  if (authCookie && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Μην ελέγχεις στατικά αρχεία και API
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};