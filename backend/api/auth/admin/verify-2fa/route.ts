import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';
import { authenticator } from 'otplib';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Validation schema
const verify2FASchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  two_factor_code: z.string().length(6, 'Mã xác thực phải có 6 chữ số'),
  temp_session_id: z.string().optional()
});

// POST /api/auth/admin/verify-2fa - Verify 2FA code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verify2FASchema.parse(body);
    
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Get temporary session if provided
    let tempSession = null;
    if (validatedData.temp_session_id) {
      const tempSessionData = await redis.get(`temp_login:${validatedData.temp_session_id}`);
      if (tempSessionData) {
        tempSession = JSON.parse(tempSessionData);
        // Clean up temp session
        await redis.del(`temp_login:${validatedData.temp_session_id}`);
      }
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select(`
        id, email, password_hash, full_name, role, 
        account_locked, two_factor_enabled, last_login
      `)
      .eq('email', validatedData.email)
      .single();

    if (userError || !user) {
      await logFailedVerification(validatedData.email, ipAddress, userAgent, 'USER_NOT_FOUND');
      
      return NextResponse.json(
        { 
          error: 'Người dùng không tồn tại',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (!['admin', 'superadmin'].includes(user.role)) {
      await logFailedVerification(validatedData.email, ipAddress, userAgent, 'INSUFFICIENT_PRIVILEGES');
      
      return NextResponse.json(
        { 
          error: 'Bạn không có quyền truy cập vào khu vực quản trị',
          code: 'INSUFFICIENT_PRIVILEGES'
        },
        { status: 403 }
      );
    }

    // Check if 2FA is enabled
    if (!user.two_factor_enabled) {
      await logFailedVerification(validatedData.email, ipAddress, userAgent, '2FA_NOT_ENABLED');
      
      return NextResponse.json(
        { 
          error: 'Xác thực 2 yếu tố chưa được kích hoạt',
          code: '2FA_NOT_ENABLED'
        },
        { status: 400 }
      );
    }

    // Get 2FA secret
    const { data: twoFactorData, error: twoFactorError } = await supabase
      .from('two_factor_auth')
      .select('secret_key, backup_codes, last_used_at')
      .eq('user_id', user.id)
      .single();

    if (twoFactorError || !twoFactorData) {
      await logFailedVerification(validatedData.email, ipAddress, userAgent, '2FA_CONFIG_ERROR');
      
      return NextResponse.json(
        { 
          error: 'Lỗi cấu hình xác thực 2 yếu tố',
          code: '2FA_CONFIG_ERROR'
        },
        { status: 500 }
      );
    }

    // Verify 2FA code
    let isValidCode = false;
    let usedBackupCode = false;

    // First try TOTP verification
    try {
      isValidCode = authenticator.verify({
        token: validatedData.two_factor_code,
        secret: twoFactorData.secret_key,
        window: 2 // Allow 2 time steps tolerance
      });
    } catch (error) {
      console.error('TOTP verification error:', error);
    }

    // If TOTP fails, try backup codes
    if (!isValidCode && twoFactorData.backup_codes) {
      const backupCodes = twoFactorData.backup_codes;
      const codeIndex = backupCodes.indexOf(validatedData.two_factor_code);
      
      if (codeIndex !== -1) {
        isValidCode = true;
        usedBackupCode = true;
        
        // Remove used backup code
        const updatedBackupCodes = backupCodes.filter((_, index) => index !== codeIndex);
        await supabase
          .from('two_factor_auth')
          .update({ backup_codes: updatedBackupCodes })
          .eq('user_id', user.id);
      }
    }

    if (!isValidCode) {
      await logFailedVerification(validatedData.email, ipAddress, userAgent, 'INVALID_2FA_CODE');
      
      return NextResponse.json(
        { 
          error: 'Mã xác thực không chính xác',
          code: 'INVALID_2FA_CODE'
        },
        { status: 401 }
      );
    }

    // Check for replay attack (same code used within time window)
    const now = new Date();
    const lastUsed = twoFactorData.last_used_at ? new Date(twoFactorData.last_used_at) : null;
    
    if (!usedBackupCode && lastUsed && (now.getTime() - lastUsed.getTime()) < 30000) { // 30 seconds
      // Additional check: verify the code hasn't been used in this exact time step
      const currentTimeStep = Math.floor(now.getTime() / 1000 / 30);
      const lastUsedTimeStep = Math.floor(lastUsed.getTime() / 1000 / 30);
      
      if (currentTimeStep === lastUsedTimeStep) {
        await logFailedVerification(validatedData.email, ipAddress, userAgent, 'CODE_REPLAY_ATTACK');
        
        return NextResponse.json(
          { 
            error: 'Mã xác thực đã được sử dụng. Vui lòng đợi mã mới.',
            code: 'CODE_ALREADY_USED'
          },
          { status: 429 }
        );
      }
    }

    // Update last used timestamp
    await supabase
      .from('two_factor_auth')
      .update({ last_used_at: now.toISOString() })
      .eq('user_id', user.id);

    // Complete login process
    const loginResult = await completeSecureLogin(user, ipAddress, userAgent, {
      method: usedBackupCode ? '2fa_backup' : '2fa_totp',
      temp_session: tempSession
    });

    // Log successful 2FA verification
    await supabase.from('audit_logs').insert({
      action: 'admin_2fa_verified',
      resource_type: 'authentication',
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      ip_address: ipAddress,
      user_agent: userAgent,
      location: await getLocationFromIP(ipAddress),
      session_id: loginResult.sessionId,
      details: {
        verification_method: usedBackupCode ? 'backup_code' : 'totp',
        backup_codes_remaining: usedBackupCode ? 
          (twoFactorData.backup_codes?.length - 1) : 
          twoFactorData.backup_codes?.length,
        temp_session_used: !!tempSession
      },
      status: 'success',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      session: loginResult.session,
      message: usedBackupCode ? 
        'Đăng nhập thành công với mã dự phòng' : 
        'Đăng nhập thành công với 2FA'
    });

  } catch (error: any) {
    console.error('2FA verification error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dữ liệu đầu vào không hợp lệ',
          details: error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi hệ thống. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

// Helper function to complete secure login
async function completeSecureLogin(user: any, ipAddress: string, userAgent: string, options: any) {
  const sessionId = generateSecureSessionId();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 8); // 8 hours for 2FA sessions

  // Create session in database
  const { data: session, error: sessionError } = await supabase
    .from('active_sessions')
    .insert({
      session_id: sessionId,
      user_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      location: await getLocationFromIP(ipAddress),
      device_type: getDeviceType(userAgent),
      expires_at: expiresAt.toISOString(),
      is_suspicious: false
    })
    .select()
    .single();

  if (sessionError) {
    throw new Error('Failed to create secure session');
  }

  // Store session in Redis with enhanced security
  await redis.setex(`session:${sessionId}`, 
    Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    JSON.stringify({
      user_id: user.id,
      email: user.email,
      role: user.role,
      session_id: sessionId,
      auth_method: options.method,
      created_at: new Date().toISOString(),
      security_level: 'high' // 2FA authenticated
    })
  );

  // Update user login info
  await supabase
    .from('profiles')
    .update({
      last_login: new Date().toISOString(),
      failed_login_attempts: 0
    })
    .eq('id', user.id);

  return { session, sessionId };
}

// Helper function to log failed verification
async function logFailedVerification(email: string, ipAddress: string, userAgent: string, reason: string) {
  await supabase.from('audit_logs').insert({
    action: 'admin_2fa_verification_failed',
    resource_type: 'authentication',
    user_email: email,
    ip_address: ipAddress,
    user_agent: userAgent,
    location: await getLocationFromIP(ipAddress),
    details: { reason },
    status: 'failed',
    timestamp: new Date().toISOString()
  });

  // Create security incident for repeated failures
  const recentFailures = await supabase
    .from('audit_logs')
    .select('id')
    .eq('action', 'admin_2fa_verification_failed')
    .eq('user_email', email)
    .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Last 15 minutes

  if (recentFailures.data && recentFailures.data.length >= 3) {
    await supabase.from('security_incidents').insert({
      type: 'failed_2fa',
      severity: 'high',
      user_email: email,
      ip_address: ipAddress,
      description: `Multiple 2FA verification failures: ${recentFailures.data.length} attempts in 15 minutes`,
      details: {
        failure_count: recentFailures.data.length,
        latest_reason: reason,
        time_window: '15_minutes'
      },
      status: 'open',
      timestamp: new Date().toISOString()
    });
  }
}

// Helper functions
function generateSecureSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 16);
  const hash = require('crypto').createHash('sha256')
    .update(`${timestamp}_${random}_2fa_admin`)
    .digest('hex')
    .substr(0, 32);
  
  return `2fa_admin_${hash}`;
}

async function getLocationFromIP(ipAddress: string): Promise<string> {
  // Implement IP geolocation lookup
  // For demo purposes, return placeholder
  return 'Vietnam';
}

function getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}
