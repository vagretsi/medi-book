import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  // 1. Παίρνουμε το cookie που ονομάσαμε 'admin_auth'
  const authCookie = request.cookies.get('admin_auth');
  
  // 2. Ελέγχουμε αν ο χρήστης προσπαθεί να πάει στη σελίδα login
  const isLoginPage = request.nextUrl.pathname === '/login';

  // 3. ΑΝ ΔΕΝ ΕΧΕΙ COOKIE και ΔΕΝ ΕΙΝΑΙ ΣΤΟ LOGIN -> Στείλτον στο Login
  if (!authCookie && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. ΑΝ ΕΧΕΙ COOKIE και ΠΑΕΙ ΣΤΟ LOGIN -> Στείλτον στο Dashboard (αφού είναι ήδη μέσα)
  if (authCookie && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// 5. ΠΟΥ ΝΑ ΤΡΕΧΕΙ: Σε όλες τις σελίδες εκτός από στατικά αρχεία και API
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};