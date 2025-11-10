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
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/forgot-password',
  '/reset-password',
  '/activate-staff',
];

// Route prefixes that require authentication
const protectedPrefixes = ['/patient', '/doctor', '/nurse', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // DEVELOPMENT MODE: Bypass authentication if DEV_MODE is enabled
  // Only check NEXT_PUBLIC_DEV_MODE, not NODE_ENV
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  
  // Debug log (commented out for cleaner logs)
  // console.log('[MIDDLEWARE DEBUG]', {
  //   pathname,
  //   devMode: process.env.NEXT_PUBLIC_DEV_MODE,
  //   nodeEnv: process.env.NODE_ENV,
  //   isDevMode,
  // });
  
  if (isDevMode) {
    console.log('[DEV MODE] Authentication bypassed for:', pathname);
    return NextResponse.next();
  }
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route));
  
  // Check if route requires authentication
  const requiresAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  
  // Get session cookie (set by backend)
  const sessionToken = request.cookies.get('session_token')?.value;
  
  // Redirect to login if accessing protected route without session
  // TEMPORARILY DISABLED FOR DEBUGGING
  if (requiresAuth && !sessionToken) {
    console.log('[Middleware] No session cookie for protected route:', pathname);
    // const loginUrl = new URL('/auth/login', request.url);
    // loginUrl.searchParams.set('redirect', pathname);
    // return NextResponse.redirect(loginUrl);
  }
  
  // Don't redirect from auth pages - let AuthContext handle it
  // Middleware can't verify if session is still valid without making API call
  // if (isPublicRoute && sessionToken && (pathname === '/auth/login' || pathname === '/auth/register')) {
  //   return NextResponse.redirect(new URL('/patient/dashboard', request.url));
  // }
  
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
