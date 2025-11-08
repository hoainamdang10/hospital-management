import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection and authentication
 */

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/services',
  '/doctors',
  '/contact',
  '/faq',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/activate-staff',
];

// Route prefixes that require authentication
const protectedPrefixes = ['/patient', '/doctor', '/nurse', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // DEVELOPMENT MODE: Bypass authentication if DEV_MODE is enabled
  // Force bypass in development (NODE_ENV check as fallback)
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || process.env.NODE_ENV === 'development';
  
  // Debug log
  console.log('[MIDDLEWARE DEBUG]', {
    pathname,
    devMode: process.env.NEXT_PUBLIC_DEV_MODE,
    nodeEnv: process.env.NODE_ENV,
    isDevMode,
  });
  
  if (isDevMode) {
    console.log('[DEV MODE] Authentication bypassed for:', pathname);
    return NextResponse.next();
  }
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route));
  
  // Check if route requires authentication
  const requiresAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  
  // Get access token from cookies or headers
  const accessToken = request.cookies.get('accessToken')?.value;
  
  // Redirect to login if accessing protected route without token
  if (requiresAuth && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to appropriate dashboard if accessing auth pages while logged in
  if (isPublicRoute && accessToken && (pathname === '/login' || pathname === '/register')) {
    // TODO: Decode token to get user role and redirect to appropriate dashboard
    return NextResponse.redirect(new URL('/patient/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
