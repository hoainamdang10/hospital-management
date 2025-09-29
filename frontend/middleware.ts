/**
 * Next.js Middleware for Authentication and Authorization
 * Updated to use Auth Service microservice as single source of truth
 * Eliminates Supabase Auth dependency in favor of unified Auth Service
 */

import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = [
  // Public pages
  '/',
  '/login',
  '/register',
  '/accept-invite',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  '/about',
  '/contact',
  '/news',
  '/faq',
  '/doctors',
  '/departments',

  // Public API routes (all go through API Gateway to microservices)
  '/api/health',

  // Auth-related pages
  '/auth/register-doctor',
  '/auth/accept-invite',

  // Payment callback pages (PayOS webhooks and public verification)
  '/api/payment/success',
  '/api/payment/cancel',
  '/api/payment/verify',
  '/api/payment/checkout-redirect',

  // Webhook endpoints (external services)
  '/api/webhooks',
]

// Routes that should be redirected to new paths
const redirectRoutes = {
  '/auth/register-patient': '/register',
  '/auth/login': '/login',
  '/auth/forgot-password': '/forgot-password',
  '/auth/reset-password': '/reset-password',
}

// Routes that require specific roles
const roleBasedRoutes = {
  '/admin': ['admin', 'superadmin'],
  '/doctors': ['doctor', 'admin', 'superadmin'], // Fixed: /doctors instead of /doctor
  '/staff': ['staff', 'receptionist', 'admin', 'superadmin'], // Added receptionist role
  '/patient': ['patient'],
}

// API routes that require authentication
const protectedApiRoutes = [
  '/api/admin',
  '/api/user',
  '/api/patient',
  '/api/doctor',
  '/api/staff',
]

// Configuration
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100'

// Auth Service validation interface
interface AuthValidationResponse {
  success: boolean
  user?: {
    id: string
    email: string
    role: string
    full_name?: string
    is_active?: boolean
  }
  error?: string
  message?: string
}

// Helper function to validate token with Auth Service
async function validateTokenWithAuthService(token: string): Promise<AuthValidationResponse> {
  try {
    console.log('🔍 [Middleware] Validating token with Auth Service...')

    const response = await fetch(`${API_GATEWAY_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      console.log(`❌ [Middleware] Auth Service returned ${response.status}`)
      return {
        success: false,
        error: `Auth service error: ${response.status}`,
      }
    }

    const data = await response.json()
    console.log('✅ [Middleware] Auth Service response:', {
      success: data.success,
      hasUser: !!data.user,
      userRole: data.user?.role
    })

    return data
  } catch (error) {
    console.error('❌ [Middleware] Auth Service validation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Helper function to get token from request
function getTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Try cookies as fallback
  const tokenFromCookie = request.cookies.get('auth_token')?.value
  if (tokenFromCookie) {
    return tokenFromCookie
  }

  return null
}

export async function middleware(request: NextRequest) {
  console.log('🔍 [Middleware] Processing request:', request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/_next')
  ) {
    return response
  }

  // Handle route redirects for deprecated paths
  if (redirectRoutes[pathname as keyof typeof redirectRoutes]) {
    const newPath = redirectRoutes[pathname as keyof typeof redirectRoutes]
    console.log('🔄 [Middleware] Redirecting deprecated route:', pathname, '→', newPath)
    return NextResponse.redirect(new URL(newPath, request.url))
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  // Get token from request
  const token = getTokenFromRequest(request)

  // Handle public routes
  if (isPublicRoute) {
    // If user has valid token and tries to access auth pages, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
      const validation = await validateTokenWithAuthService(token)
      if (validation.success && validation.user) {
        const dashboardUrl = getDashboardUrl(validation.user.role)
        console.log('🔄 [Middleware] Redirecting authenticated user from auth page to:', dashboardUrl)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    }
    return response
  }

  // Require authentication for protected routes
  if (!token) {
    console.log('❌ [Middleware] No token found, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Validate token with Auth Service
  const validation = await validateTokenWithAuthService(token)

  if (!validation.success || !validation.user) {
    console.log('❌ [Middleware] Token validation failed, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const user = validation.user

  // Check if user account is active
  if (user.is_active === false) {
    console.log('❌ [Middleware] User account is inactive')
    return NextResponse.redirect(new URL('/account-suspended', request.url))
  }

  // Handle role-based route protection
  for (const [routePrefix, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      if (!allowedRoles.includes(user.role)) {
        console.log(`❌ [Middleware] Role ${user.role} not allowed for ${routePrefix}`)
        // Redirect to appropriate dashboard
        const dashboardUrl = getDashboardUrl(user.role)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
      break
    }
  }

  // Handle API route protection
  if (pathname.startsWith('/api/')) {
    const isProtectedApi = protectedApiRoutes.some(route =>
      pathname.startsWith(route)
    )

    if (isProtectedApi) {
      // Check specific API permissions
      if (pathname.startsWith('/api/admin') && !['admin', 'superadmin'].includes(user.role)) {
        return new NextResponse(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        )
      }

      if (pathname.startsWith('/api/doctor') && !['doctor', 'admin', 'superadmin'].includes(user.role)) {
        return new NextResponse(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        )
      }

      if (pathname.startsWith('/api/staff') && !['staff', 'admin', 'superadmin'].includes(user.role)) {
        return new NextResponse(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        )
      }
    }
  }

  // Add user info to headers for API routes and downstream services
  if (pathname.startsWith('/api/')) {
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-role', user.role)
    response.headers.set('x-user-email', user.email)
    if (user.full_name) {
      response.headers.set('x-user-name', user.full_name)
    }
  }

  console.log('✅ [Middleware] Request authorized for user:', {
    id: user.id,
    role: user.role,
    path: pathname
  })

  return response
}

// Helper function to get dashboard URL based on role
function getDashboardUrl(role: string): string {
  switch (role) {
    case 'admin':
    case 'superadmin':
      return '/admin/dashboard'
    case 'doctor':
      return '/doctors/dashboard'
    case 'patient':
      return '/patient/dashboard'
    case 'staff':
    case 'receptionist':
      return '/staff/dashboard'
    default:
      console.warn(`Unknown role: ${role}, defaulting to patient dashboard`)
      return '/patient/dashboard'
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
