import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const path = request.nextUrl.pathname;
  
  const isProtected = path.startsWith('/account') || 
                      path.startsWith('/admin') || 
                      path.startsWith('/volunteer') || 
                      path.startsWith('/expenses') || 
                      path.startsWith('/door') || 
                      path.startsWith('/cart');
                      
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login?next=' + path, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
