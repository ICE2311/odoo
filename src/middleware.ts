import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isProtected = path.startsWith('/account') || 
                      path.startsWith('/admin') || 
                      path.startsWith('/volunteer') || 
                      path.startsWith('/expenses') || 
                      path.startsWith('/door') || 
                      path.startsWith('/cart');
                      
  const hasSession = request.cookies.has('authjs.session-token') || request.cookies.has('__Secure-authjs.session-token');

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login?next=' + path, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
