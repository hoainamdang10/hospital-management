import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_STORAGE_KEY = 'hospital_auth';

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard'];

// Public routes that should redirect to dashboard if already authenticated
const PUBLIC_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user is authenticated by looking for auth token in cookies
  // Note: In client-side, we use localStorage, but for middleware we need cookies
  const authCookie = request.cookies.get(AUTH_STORAGE_KEY);
  const isAuthenticated = !!authCookie;

  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing public route while authenticated
  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
