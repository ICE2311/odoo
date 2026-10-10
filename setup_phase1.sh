#!/bin/bash
mkdir -p src/server/actions src/app/\(public\)/login src/app/\(public\)/register src/app/\(account\)/account/profile src/app/\(admin\)/admin/users src/app/\(admin\)/admin/settings src/app/\(admin\)/admin/audit-log src/tests/unit src/tests/integration src/server/db

# package.json scripts update
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
pkg.scripts = {
  ...pkg.scripts,
  'db:generate': 'drizzle-kit generate',
  'db:migrate': 'drizzle-kit migrate',
  'db:seed': 'tsx src/server/db/seed.ts',
  'db:reset:test': 'tsx src/server/db/reset-test.ts',
  'typecheck': 'tsc --noEmit',
  'lint': 'eslint src --ext .ts,.tsx',
  'test': 'vitest run',
  'test:e2e': 'playwright test',
  'build': 'next build'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Basic middleware
cat << 'INNER_EOF' > src/middleware.ts
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
INNER_EOF

# Move page.tsx
mv src/app/page.tsx src/app/\(public\)/page.tsx
