/**
 * Verify Staff Invitation Token API Route
 * Validates invitation tokens and returns invitation details
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/backend/lib/supabase/server'
import { verifyInvitationToken } from '@/backend/lib/security/crypto'
import { rateLimiter, rateLimitConfigs, getClientIdentifier } from '@/backend/lib/security/rate-limiter'
import { AuditLogger, extractAuditContext } from '@/backend/lib/security/audit'
import { addSecurityHeaders } from '@/backend/lib/security/crypto'
import { createHash } from 'crypto'
import { z } from 'zod'

const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token là bắt buộc'),
})

export async function POST(request: NextRequest) {
  const context = extractAuditContext(request)
  
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimiter.checkLimit(
      clientId,
      rateLimitConfigs.captcha // Reuse captcha rate limit config
    )

    if (!rateLimitResult.allowed) {
      await AuditLogger.logSecurityEvent(
        'invitation_verify',
        undefined,
        context,
        { reason: 'rate_limit_exceeded' }
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
    const validationResult = verifyTokenSchema.safeParse(body)
    
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

    const { token } = validationResult.data

    // Verify invitation token cryptographically
    const tokenVerification = verifyInvitationToken(token)
    if (!tokenVerification.valid) {
      await AuditLogger.logSecurityEvent(
        'invitation_verify',
        undefined,
        context,
        { reason: 'invalid_token_format', error: tokenVerification.error }
      )
      
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Token lời mời không hợp lệ.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    const { email, role } = tokenVerification

    // Check if invitation exists in database and is still valid
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('staff_invitations')
      .select(`
        *,
        invited_by_profile:profiles!staff_invitations_invited_by_fkey(
          full_name,
          email
        ),
        department:departments(
          id,
          name,
          description
        )
      `)
      .eq('token_hash', tokenHash)
      .eq('email', email)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invitationError || !invitation) {
      await AuditLogger.logSecurityEvent(
        'invitation_verify',
        undefined,
        context,
        { 
          reason: 'invitation_not_found_or_expired', 
          email, 
          token_hash: tokenHash,
          error: invitationError?.message 
        }
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
        'invitation_verify',
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

    // Log successful token verification
    await AuditLogger.log({
      actorId: undefined,
      action: 'invitation_token_verified',
      resourceType: 'invitation',
      resourceId: invitation.id,
      details: {
        email,
        role,
        department_id: invitation.department_id,
      },
      severity: 'info',
      ...context,
    })

    // Return invitation details
    return addSecurityHeaders(new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Token lời mời hợp lệ',
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          department: invitation.department,
          invited_by: invitation.invited_by_profile,
          expires_at: invitation.expires_at,
          metadata: invitation.metadata || {},
          created_at: invitation.created_at,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    ))

  } catch (error) {
    console.error('Verify invitation error:', error)
    
    await AuditLogger.logSecurityEvent(
      'invitation_verify',
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
