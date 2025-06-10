// middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',       // NextAuth REST handlers
  '/_next/',         // Next.js internals
  '/favicon.ico',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // If it’s a public path, let it through
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Otherwise check for a valid NextAuth token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log('[middleware] token:', Boolean(token), 'for', pathname);

  if (!token) {
    // Not logged in—redirect to /login (preserves ?callbackUrl=… automatically)
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in—allow
  return NextResponse.next();
}

// Run for every page under / and /oudercontacten/**
export const config = {
  matcher: ['/', '/oudercontacten/:path*'],
};
