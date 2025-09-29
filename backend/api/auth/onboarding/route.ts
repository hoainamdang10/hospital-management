/**
 * Patient Onboarding API Route
 * Handles patient onboarding wizard (Step 2) after email verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/backend/lib/supabase/server'
import { patientOnboardingSchema } from '@/backend/lib/validations/auth'
import { rateLimiter, rateLimitConfigs, getClientIdentifier } from '@/backend/lib/security/rate-limiter'
import { AuditLogger, extractAuditContext } from '@/backend/lib/security/audit'
import { addSecurityHeaders } from '@/backend/lib/security/crypto'

export async function POST(request: NextRequest) {
  const context = extractAuditContext(request)
  
  try {
    // Create Supabase client for user session
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Unauthorized. Please log in first.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Apply rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimitResult = rateLimiter.check(identifier, 'profileUpdate', rateLimitConfigs.profileUpdate)
    
    if (!rateLimitResult.allowed) {
      await AuditLogger.logSecurityEvent(
        'profile_update',
        user.id,
        context,
        { reason: 'rate_limit_exceeded', identifier }
      )
      
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Quá nhiều yêu cầu cập nhật. Vui lòng thử lại sau.',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitConfigs.profileUpdate.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      ))
    }

    // Check if user is a patient
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, onboarding_completed, email_verified')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Không tìm thấy thông tin người dùng.',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    if (profile.role !== 'patient') {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Chỉ bệnh nhân mới có thể hoàn tất onboarding.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    if (!profile.email_verified) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Vui lòng xác thực email trước khi hoàn tất onboarding.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    if (profile.onboarding_completed) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Onboarding đã được hoàn tất trước đó.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = patientOnboardingSchema.safeParse(body)
    
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
      phone,
      preferred_language,
      contact_channel,
      address,
      insurance,
      emergency_contact,
      medical_info,
      documents,
    } = validationResult.data

    // Start database transaction
    try {
      // Update profile with contact information
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({
          phone,
          preferred_language,
          contact_channel,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileUpdateError) {
        throw new Error(`Profile update failed: ${profileUpdateError.message}`)
      }

      // Update patient profile with medical information
      const patientProfileUpdate: any = {
        onboarding_completed: true,
      }

      if (medical_info) {
        if (medical_info.blood_type) patientProfileUpdate.blood_type = medical_info.blood_type
        if (medical_info.allergies) patientProfileUpdate.allergies = medical_info.allergies
        if (medical_info.chronic_conditions) patientProfileUpdate.chronic_conditions = medical_info.chronic_conditions
      }

      const { error: patientProfileError } = await supabaseAdmin
        .from('patient_profiles')
        .update(patientProfileUpdate)
        .eq('user_id', user.id)

      if (patientProfileError) {
        throw new Error(`Patient profile update failed: ${patientProfileError.message}`)
      }

      // Insert address
      if (address) {
        const { error: addressError } = await supabaseAdmin
          .from('addresses')
          .insert({
            user_id: user.id,
            type: 'home',
            line1: address.line1,
            line2: address.line2 || null,
            ward: address.ward || null,
            district: address.district || null,
            city: address.city,
            postal_code: address.postal_code || null,
            country: address.country || 'VN',
            is_primary: true,
          })

        if (addressError) {
          throw new Error(`Address creation failed: ${addressError.message}`)
        }
      }

      // Insert emergency contact
      if (emergency_contact) {
        const { error: emergencyContactError } = await supabaseAdmin
          .from('emergency_contacts')
          .insert({
            user_id: user.id,
            name: emergency_contact.name,
            relation: emergency_contact.relation,
            phone: emergency_contact.phone,
            email: emergency_contact.email || null,
            is_primary: true,
          })

        if (emergencyContactError) {
          throw new Error(`Emergency contact creation failed: ${emergencyContactError.message}`)
        }
      }

      // Log successful onboarding completion
      await AuditLogger.log({
        actorId: user.id,
        action: 'profile_update',
        resourceType: 'profile',
        resourceId: user.id,
        details: {
          onboarding_completed: true,
          has_address: !!address,
          has_emergency_contact: !!emergency_contact,
          has_insurance: !!(insurance && insurance.insurance_number),
          has_medical_info: !!medical_info,
        },
        severity: 'info',
        ...context,
      })

      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: true,
          message: 'Hoàn tất onboarding thành công! Chào mừng bạn đến với hệ thống.',
          data: {
            user_id: user.id,
            onboarding_completed: true,
            next_step: 'dashboard',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      ))

    } catch (dbError) {
      console.error('Onboarding database error:', dbError)
      
      await AuditLogger.logSecurityEvent(
        'profile_update',
        user.id,
        context,
        { 
          reason: 'onboarding_database_error', 
          error: dbError instanceof Error ? dbError.message : 'Unknown error' 
        }
      )

      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Không thể hoàn tất onboarding. Vui lòng thử lại sau.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

  } catch (error) {
    console.error('Onboarding error:', error)
    
    await AuditLogger.logSecurityEvent(
      'profile_update',
      undefined,
      context,
      { 
        reason: 'onboarding_unexpected_error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
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
