/**
 * Accept Staff Invitation API Route
 * Handles staff invitation acceptance with comprehensive security
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/lib/supabase/server'
import { acceptInviteSchema } from '@/backend/lib/validations/auth'
import { verifyInvitationToken, generateSecureToken } from '@/backend/lib/security/crypto'
import { rateLimiter, rateLimitConfigs, getClientIdentifier } from '@/backend/lib/security/rate-limiter'
import { AuditLogger, extractAuditContext } from '@/backend/lib/security/audit'
import { addSecurityHeaders } from '@/backend/lib/security/crypto'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  const context = extractAuditContext(request)
  
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimiter.checkLimit(
      clientId,
      rateLimitConfigs.acceptInvitation
    )

    if (!rateLimitResult.allowed) {
      await AuditLogger.logSecurityEvent(
        'invitation_accept',
        undefined,
        context,
        { reason: 'rate_limit_exceeded', limit: rateLimitConfigs.acceptInvitation }
      )

      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = acceptInviteSchema.safeParse(body)
    
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
      token,
      password,
      mfa_opt_in,
      accept_tos,
      accept_privacy,
    } = validationResult.data

    // Verify invitation token
    const tokenVerification = verifyInvitationToken(token)
    if (!tokenVerification.valid) {
      await AuditLogger.logSecurityEvent(
        'invitation_accept',
        undefined,
        context,
        { reason: 'invalid_token', error: tokenVerification.error }
      )
      
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Lời mời không hợp lệ hoặc đã hết hạn.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    const { email, role } = tokenVerification

    // Check if invitation exists and is still valid
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('staff_invitations')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('email', email)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invitationError || !invitation) {
      await AuditLogger.logSecurityEvent(
        'invitation_accept',
        undefined,
        context,
        { reason: 'invitation_not_found', email, token_hash: tokenHash }
      )
      
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Lời mời không tồn tại, đã được sử dụng hoặc đã hết hạn.',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    if (existingUser.user) {
      await AuditLogger.logSecurityEvent(
        'invitation_accept',
        undefined,
        context,
        { reason: 'user_already_exists', email }
      )
      
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Tài khoản với email này đã tồn tại. Vui lòng đăng nhập.',
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
      email_confirm: true, // Auto-confirm for invited users
      user_metadata: {
        role,
        invited: true,
        invitation_id: invitation.id,
      },
      app_metadata: {
        role,
        onboarding_completed: true, // Staff don't need onboarding
      },
    })

    if (authError || !authData.user) {
      await AuditLogger.logSecurityEvent(
        'invitation_accept',
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
          full_name: invitation.metadata?.full_name || email.split('@')[0],
          role,
          is_active: true,
          email_verified: true,
          onboarding_completed: true,
          terms_accepted_at: accept_tos ? new Date().toISOString() : null,
          privacy_accepted_at: accept_privacy ? new Date().toISOString() : null,
        })

      if (profileError) {
        throw new Error(`Profile creation failed: ${profileError.message}`)
      }

      // Create role-specific profile based on role
      // Note: Role-specific profiles will be created by database triggers or later processes
      // For now, we just create the main profile record
      console.log(`Created user profile for ${role}: ${userId}`)

      // Mark invitation as consumed
      const { error: updateError } = await supabaseAdmin
        .from('staff_invitations')
        .update({
          consumed_at: new Date().toISOString(),
          consumed_by: userId,
        })
        .eq('id', invitation.id)

      if (updateError) {
        console.warn('Failed to mark invitation as consumed:', updateError)
      }

      // Log successful invitation acceptance
      await AuditLogger.log({
        actorId: userId,
        action: 'invitation_accepted',
        resourceType: 'invitation',
        resourceId: invitation.id,
        details: {
          email,
          role,
          department_id: invitation.department_id,
          mfa_enabled: mfa_opt_in,
        },
        severity: 'info',
        ...context,
      })

      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: true,
          message: 'Chấp nhận lời mời thành công! Chào mừng bạn đến với hệ thống.',
          data: {
            user: {
              id: userId,
              email,
              role,
            },
            isNewUser: true,
            next_step: `/${role}`,
          },
        }),
        {
          status: 200,
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
        'invitation_accept',
        userId,
        context,
        { reason: 'database_operation_failed', email, error: dbError instanceof Error ? dbError.message : 'Unknown error' }
      )

      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Không thể hoàn tất chấp nhận lời mời. Vui lòng thử lại sau.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

  } catch (error) {
    console.error('Accept invitation error:', error)
    
    await AuditLogger.logSecurityEvent(
      'invitation_accept',
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
