/**
 * Next.js Middleware for Authentication and Authorization
 * Production-ready middleware with role-based access control, rate limiting, and audit logging
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimiter, rateLimitConfigs, getClientIdentifier } from '@/backend/lib/security/rate-limiter'
import { AuditLogger, extractAuditContext } from '@/backend/lib/security/audit'

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/accept-invite',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  '/api/auth/captcha/verify',
  '/api/health',
]

// Routes that require specific roles
const roleBasedRoutes = {
  '/admin': ['admin', 'superadmin'],
  '/doctor': ['doctor', 'admin', 'superadmin'],
  '/staff': ['staff', 'admin', 'superadmin'],
  '/patient': ['patient'],
}

// API routes that require rate limiting
const rateLimitedRoutes = {
  '/api/auth/login': 'login',
  '/api/auth/register': 'register',
  '/api/auth/forgot-password': 'forgotPassword',
  '/api/auth/reset-password': 'resetPassword',
  '/api/auth/captcha/verify': 'captcha',
  '/api/admin/invitations': 'createInvitation',
  '/api/auth/accept-invite': 'acceptInvitation',
} as const

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const context = extractAuditContext(request)

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitKey = Object.keys(rateLimitedRoutes).find(route => 
      pathname.startsWith(route)
    ) as keyof typeof rateLimitedRoutes

    if (rateLimitKey) {
      const identifier = getClientIdentifier(request)
      const action = rateLimitedRoutes[rateLimitKey]
      const config = rateLimitConfigs[action]
      
      const rateLimitResult = rateLimiter.check(identifier, action, config)
      
      if (!rateLimitResult.allowed) {
        // Log rate limit violation
        await AuditLogger.logSecurityEvent(
          'user_login_failed',
          undefined,
          context,
          { 
            reason: 'rate_limit_exceeded', 
            endpoint: pathname,
            identifier,
            retryAfter: rateLimitResult.retryAfter
          }
        )

        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Too many requests. Please try again later.',
            retryAfter: rateLimitResult.retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
              ...(rateLimitResult.retryAfter && {
                'Retry-After': rateLimitResult.retryAfter.toString(),
              }),
            },
          }
        )
      }

      // Add rate limit headers to response
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
      
      return response
    }
  }

  // Skip auth check for public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Create Supabase client
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // If no user and trying to access protected route, redirect to login
  if (!user && !publicRoutes.includes(pathname)) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('returnUrl', pathname)
    
    await AuditLogger.logSecurityEvent(
      'user_login_failed',
      undefined,
      context,
      { reason: 'unauthenticated_access', attempted_path: pathname }
    )
    
    return NextResponse.redirect(redirectUrl)
  }

  // If user exists, check role-based access
  if (user) {
    const userRole = user.app_metadata?.role || user.user_metadata?.role

    // Check role-based route access
    for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          await AuditLogger.logSecurityEvent(
            'user_login_failed',
            user.id,
            context,
            { 
              reason: 'insufficient_permissions', 
              user_role: userRole,
              required_roles: allowedRoles,
              attempted_path: pathname
            }
          )

          // Redirect to appropriate dashboard based on user role
          const dashboardUrl = getDashboardUrl(userRole)
          return NextResponse.redirect(new URL(dashboardUrl, request.url))
        }
        break
      }
    }

    // Log successful access for sensitive routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      await AuditLogger.log({
        actorId: user.id,
        action: 'admin_action',
        resourceType: 'user',
        details: { action: 'route_access', path: pathname },
        severity: 'info',
        ...context
      })
    }
  }

  return response
}

function getDashboardUrl(role: string): string {
  switch (role) {
    case 'admin':
    case 'superadmin':
      return '/admin'
    case 'doctor':
      return '/doctor'
    case 'staff':
      return '/staff'
    case 'patient':
      return '/patient'
    default:
      return '/login'
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
