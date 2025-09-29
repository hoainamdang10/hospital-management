/**
 * Admin Staff Invitations API Route
 * CRUD operations for managing staff invitations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/backend/lib/supabase/server'
import { createInvitationSchema } from '@/backend/lib/validations/auth'
import { generateInvitationToken } from '@/backend/lib/security/crypto'
import { rateLimiter, rateLimitConfigs, getClientIdentifier } from '@/backend/lib/security/rate-limiter'
import { AuditLogger, extractAuditContext } from '@/backend/lib/security/audit'
import { addSecurityHeaders } from '@/backend/lib/security/crypto'
import { emailService } from '@/backend/lib/services/email.service'
import { z } from 'zod'

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
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

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return null
  }

  // Check if user is admin
  const userRole = user.app_metadata?.role || user.user_metadata?.role
  if (!['admin', 'superadmin'].includes(userRole)) {
    return null
  }

  return user
}

// GET /api/admin/invitations - List invitations
export async function GET(request: NextRequest) {
  const context = extractAuditContext(request)
  
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Unauthorized. Admin access required.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('staff_invitations')
      .select(`
        *,
        invited_by_profile:profiles!staff_invitations_invited_by_fkey(
          full_name,
          email
        ),
        consumed_by_profile:profiles!staff_invitations_consumed_by_fkey(
          full_name,
          email
        ),
        department:departments(
          id,
          name,
          description
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter
    const now = new Date().toISOString()
    switch (status) {
      case 'active':
        query = query.is('consumed_at', null).gt('expires_at', now)
        break
      case 'consumed':
        query = query.not('consumed_at', 'is', null)
        break
      case 'expired':
        query = query.is('consumed_at', null).lt('expires_at', now)
        break
      // 'all' - no additional filter
    }

    const { data: invitations, error: invitationsError } = await query

    if (invitationsError) {
      throw new Error(`Failed to fetch invitations: ${invitationsError.message}`)
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('staff_invitations')
      .select('*', { count: 'exact', head: true })

    // Apply same status filter for count
    switch (status) {
      case 'active':
        countQuery = countQuery.is('consumed_at', null).gt('expires_at', now)
        break
      case 'consumed':
        countQuery = countQuery.not('consumed_at', 'is', null)
        break
      case 'expired':
        countQuery = countQuery.is('consumed_at', null).lt('expires_at', now)
        break
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      throw new Error(`Failed to count invitations: ${countError.message}`)
    }

    // Add status to each invitation
    const invitationsWithStatus = invitations?.map(invitation => {
      let invitationStatus = 'active'
      if (invitation.consumed_at) {
        invitationStatus = 'consumed'
      } else if (new Date(invitation.expires_at) < new Date()) {
        invitationStatus = 'expired'
      }

      return {
        ...invitation,
        status: invitationStatus,
      }
    })

    return addSecurityHeaders(new NextResponse(
      JSON.stringify({
        success: true,
        data: invitationsWithStatus,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    ))

  } catch (error) {
    console.error('Get invitations error:', error)
    
    await AuditLogger.logSecurityEvent(
      'admin_invitations_list',
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

// POST /api/admin/invitations - Create invitation
export async function POST(request: NextRequest) {
  const context = extractAuditContext(request)
  
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Unauthorized. Admin access required.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimiter.checkLimit(
      clientId,
      rateLimitConfigs.createInvitation
    )

    if (!rateLimitResult.allowed) {
      await AuditLogger.logSecurityEvent(
        'admin_invitation_create',
        user.id,
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
    const validationResult = createInvitationSchema.safeParse(body)
    
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
      email,
      role,
      department_id,
      expires_in_days,
      message,
    } = validationResult.data

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    if (existingUser.user) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Tài khoản với email này đã tồn tại.',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Check if there's already an active invitation for this email
    const { data: existingInvitation } = await supabaseAdmin
      .from('staff_invitations')
      .select('id')
      .eq('email', email)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingInvitation) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Đã có lời mời đang hoạt động cho email này.',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Generate invitation token
    const { token, tokenHash, expiresAt } = generateInvitationToken(email, role, expires_in_days)

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('staff_invitations')
      .insert({
        email,
        role,
        department_id,
        token_hash: tokenHash,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        metadata: {
          message,
          created_by_email: user.email,
        },
      })
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
      .single()

    if (invitationError || !invitation) {
      throw new Error(`Failed to create invitation: ${invitationError?.message}`)
    }

    // Generate invitation URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/accept-invite?token=${encodeURIComponent(token)}`

    // Send invitation email
    let emailSent = false
    let emailError = null

    try {
      const emailResult = await emailService.sendInvitationEmail({
        email,
        role,
        inviteUrl,
        invitedBy: invitation.invited_by_profile?.full_name || user.email || 'Quản trị viên',
        departmentName: invitation.department?.name,
        message,
        expiresAt: expiresAt.toISOString(),
      })

      emailSent = emailResult.success
      if (!emailResult.success) {
        emailError = emailResult.error
        console.warn('Failed to send invitation email:', emailResult.error)
      }
    } catch (error) {
      console.error('Email service error:', error)
      emailError = error instanceof Error ? error.message : 'Unknown email error'
    }

    // Log successful invitation creation
    await AuditLogger.log({
      actorId: user.id,
      action: 'invitation_created',
      resourceType: 'invitation',
      resourceId: invitation.id,
      details: {
        email,
        role,
        department_id,
        expires_in_days,
        email_sent: emailSent,
        email_error: emailError,
      },
      severity: 'info',
      ...context,
    })

    return addSecurityHeaders(new NextResponse(
      JSON.stringify({
        success: true,
        message: emailSent
          ? 'Lời mời đã được tạo và gửi email thành công'
          : 'Lời mời đã được tạo thành công (không thể gửi email)',
        data: {
          ...invitation,
          invite_url: inviteUrl,
          status: 'active',
          email_sent: emailSent,
          email_error: emailError,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    ))

  } catch (error) {
    console.error('Create invitation error:', error)
    
    await AuditLogger.logSecurityEvent(
      'admin_invitation_create',
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

// DELETE /api/admin/invitations - Revoke invitation
export async function DELETE(request: NextRequest) {
  const context = extractAuditContext(request)

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Unauthorized. Admin access required.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'ID lời mời là bắt buộc',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(invitationId)) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'ID lời mời không hợp lệ',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Check if invitation exists and is not consumed
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('staff_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Lời mời không tồn tại',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    if (invitation.consumed_at) {
      return addSecurityHeaders(new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Không thể thu hồi lời mời đã được sử dụng',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ))
    }

    // Revoke invitation by setting expires_at to now
    const { error: revokeError } = await supabaseAdmin
      .from('staff_invitations')
      .update({
        expires_at: new Date().toISOString(),
        metadata: {
          ...invitation.metadata,
          revoked_at: new Date().toISOString(),
          revoked_by: user.id,
          revoked_by_email: user.email,
        },
      })
      .eq('id', invitationId)

    if (revokeError) {
      throw new Error(`Failed to revoke invitation: ${revokeError.message}`)
    }

    // Log successful invitation revocation
    await AuditLogger.log({
      actorId: user.id,
      action: 'invitation_revoked',
      resourceType: 'invitation',
      resourceId: invitationId,
      details: {
        email: invitation.email,
        role: invitation.role,
        department_id: invitation.department_id,
      },
      severity: 'info',
      ...context,
    })

    return addSecurityHeaders(new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Lời mời đã được thu hồi thành công',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    ))

  } catch (error) {
    console.error('Revoke invitation error:', error)

    await AuditLogger.logSecurityEvent(
      'admin_invitation_revoke',
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
