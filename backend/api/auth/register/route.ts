/**
 * Patient Registration API Route
 * Public endpoint for patient self-registration with comprehensive security
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/lib/supabase/server'
import { patientRegisterSchema } from '@/backend/lib/validations/auth'
import { verifyCaptcha } from '@/backend/lib/security/captcha'
import { rateLimiter, rateLimitConfigs, getClientIdentifier } from '@/backend/lib/security/rate-limiter'
import { AuditLogger, extractAuditContext } from '@/backend/lib/security/audit'
import { addSecurityHeaders } from '@/backend/lib/security/crypto'

export async function POST(request: NextRequest) {
  const context = extractAuditContext(request)
  
  try {
    // Apply rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimitResult = rateLimiter.check(identifier, 'register', rateLimitConfigs.register)
    
    if (!rateLimitResult.allowed) {
      await AuditLogger.logSecurityEvent(
        'user_register',
        undefined,
        context,
        { reason: 'rate_limit_exceeded', identifier }
      )
      
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau.',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitConfigs.register.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            ...(rateLimitResult.retryAfter && {
              'Retry-After': rateLimitResult.retryAfter.toString(),
            }),
          },
        }
      ))
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = patientRegisterSchema.safeParse(body)
    
    if (!validationResult.success) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Dữ liệu không hợp lệ',
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    const {
      full_name,
      date_of_birth,
      gender,
      email,
      password,
      accept_tos,
      accept_privacy,
      captcha_token,
    } = validationResult.data

    // Verify CAPTCHA
    const captchaVerification = await verifyCaptcha(captcha_token, context.ipAddress)
    if (!captchaVerification.success) {
      await AuditLogger.logSecurityEvent(
        'user_register',
        undefined,
        context,
        { reason: 'captcha_failed', email, error: captchaVerification.error }
      )
      
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Xác thực CAPTCHA thất bại. Vui lòng thử lại.',
          details: captchaVerification.error,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    if (existingUser.user) {
      await AuditLogger.logSecurityEvent(
        'user_register',
        undefined,
        context,
        { reason: 'email_already_exists', email }
      )
      
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Email đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập.',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We'll handle email verification manually
      user_metadata: {
        full_name,
        role: 'patient',
        registration_ip: context.ipAddress,
        registration_user_agent: context.userAgent,
      },
      app_metadata: {
        role: 'patient',
        onboarding_completed: false,
      },
    })

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError)
      
      await AuditLogger.logSecurityEvent(
        'user_register',
        undefined,
        context,
        { reason: 'auth_creation_failed', email, error: authError?.message }
      )
      
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Không thể tạo tài khoản. Vui lòng thử lại sau.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    const userId = authData.user.id

    try {
      // Create profile record
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name,
          role: 'patient',
          date_of_birth: date_of_birth || null,
          gender: gender || null,
          is_active: true,
          email_verified: false,
          onboarding_completed: false,
          terms_accepted_at: accept_tos ? new Date().toISOString() : null,
          privacy_accepted_at: accept_privacy ? new Date().toISOString() : null,
        })

      if (profileError) {
        throw new Error(`Profile creation failed: ${profileError.message}`)
      }

      // Create patient record in patients table
      const patientId = `PAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`

      const { error: patientError } = await supabaseAdmin
        .from('patients')
        .insert({
          patient_id: patientId,
          profile_id: userId,
          gender: gender || 'other',
          blood_type: null,
          address: null,
          emergency_contact: null,
          insurance_info: null,
          medical_history: null,
          allergies: null,
          chronic_conditions: null,
          current_medications: null,
          status: 'active',
          notes: null,
          created_by: userId,
        })

      if (patientError) {
        throw new Error(`Patient record creation failed: ${patientError.message}`)
      }

      // Create consent records
      const consentRecords = [
        {
          user_id: userId,
          consent_type: 'tos',
          version: '1.0',
          granted: accept_tos,
          granted_at: accept_tos ? new Date().toISOString() : null,
          ip_address: context.ipAddress,
          user_agent: context.userAgent,
        },
        {
          user_id: userId,
          consent_type: 'privacy',
          version: '1.0',
          granted: accept_privacy,
          granted_at: accept_privacy ? new Date().toISOString() : null,
          ip_address: context.ipAddress,
          user_agent: context.userAgent,
        },
      ]

      const { error: consentError } = await supabaseAdmin
        .from('consents')
        .insert(consentRecords)

      if (consentError) {
        console.warn('Consent creation failed:', consentError)
        // Don't fail registration for consent errors, but log it
      }

      // Send email verification
      const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding`,
        },
      })

      if (emailError) {
        console.warn('Email verification failed:', emailError)
        // Don't fail registration for email errors
      }

      // Log successful registration
      await AuditLogger.logRegistration(
        userId,
        'patient',
        context,
        {
          email,
          full_name,
          captcha_score: captchaVerification.score,
          email_verification_sent: !emailError,
        }
      )

      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: true,
          message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
          data: {
            user_id: userId,
            email,
            full_name,
            next_step: 'email_verification',
          },
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      ))

    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      
      // Cleanup: Delete the auth user if database operations failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }

      await AuditLogger.logSecurityEvent(
        'user_register',
        userId,
        context,
        { reason: 'database_operation_failed', email, error: dbError instanceof Error ? dbError.message : 'Unknown error' }
      )

      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Không thể hoàn tất đăng ký. Vui lòng thử lại sau.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

  } catch (error) {
    console.error('Registration error:', error)
    
    await AuditLogger.logSecurityEvent(
      'user_register',
      undefined,
      context,
      { reason: 'unexpected_error', error: error instanceof Error ? error.message : 'Unknown error' }
    )

    return addSecurityHeaders(new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    ))
  }
}

// Only allow POST method
export async function GET() {
  return addSecurityHeaders(new NextResponse(
    JSON.stringify({
      success: false,
      error: 'Method not allowed',
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  ))
}
