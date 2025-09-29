import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { detectSuspiciousActivity, updateSecurityMetrics } from '@/backend/api/admin/security/metrics/route';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Validation schema
const adminLoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  remember_me: z.boolean().default(false),
  security_context: z.object({
    ip_address: z.string().optional(),
    user_agent: z.string().optional(),
    device_info: z.string().optional()
  }).optional()
});

// POST /api/auth/admin/login - Admin login endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = adminLoginSchema.parse(body);
    
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check for rate limiting
    const rateLimitKey = `login_attempts:${ipAddress}`;
    const attempts = await redis.get(rateLimitKey);
    
    if (attempts && parseInt(attempts) >= 10) {
      await logSecurityIncident('rate_limit_exceeded', {
        ip_address: ipAddress,
        email: validatedData.email,
        attempts: parseInt(attempts)
      });

      return NextResponse.json(
        { 
          error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select(`
        id, email, password_hash, full_name, role, 
        account_locked, locked_at, failed_login_attempts,
        two_factor_enabled, last_login, created_at
      `)
      .eq('email', validatedData.email)
      .single();

    if (userError || !user) {
      await incrementLoginAttempts(ipAddress);
      await logFailedLogin(validatedData.email, ipAddress, userAgent, 'USER_NOT_FOUND');
      
      return NextResponse.json(
        { 
          error: 'Email hoặc mật khẩu không chính xác',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!['admin', 'superadmin'].includes(user.role)) {
      await incrementLoginAttempts(ipAddress);
      await logFailedLogin(validatedData.email, ipAddress, userAgent, 'INSUFFICIENT_PRIVILEGES');
      
      return NextResponse.json(
        { 
          error: 'Bạn không có quyền truy cập vào khu vực quản trị',
          code: 'INSUFFICIENT_PRIVILEGES'
        },
        { status: 403 }
      );
    }

    // Check if account is locked
    if (user.account_locked) {
      const lockoutDuration = 30 * 60 * 1000; // 30 minutes
      const lockedAt = new Date(user.locked_at).getTime();
      const unlockTime = lockedAt + lockoutDuration;
      
      if (Date.now() < unlockTime) {
        await logFailedLogin(validatedData.email, ipAddress, userAgent, 'ACCOUNT_LOCKED');
        
        return NextResponse.json(
          { 
            error: 'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần',
            code: 'ACCOUNT_LOCKED',
            unlock_time: unlockTime
          },
          { status: 423 }
        );
      } else {
        // Unlock account
        await supabase
          .from('profiles')
          .update({
            account_locked: false,
            locked_at: null,
            failed_login_attempts: 0
          })
          .eq('id', user.id);
      }
    }

    // Verify password
    const passwordValid = await bcrypt.compare(validatedData.password, user.password_hash);
    
    if (!passwordValid) {
      await incrementLoginAttempts(ipAddress);
      await handleFailedLogin(user.id, validatedData.email, ipAddress, userAgent);
      
      return NextResponse.json(
        { 
          error: 'Email hoặc mật khẩu không chính xác',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Check for suspicious activity
    const isSuspicious = await detectSuspiciousActivity(user.id, ipAddress, userAgent);
    
    // Check if 2FA is required
    if (user.two_factor_enabled) {
      // Store temporary login session
      const tempSessionId = generateSessionId();
      await redis.setex(`temp_login:${tempSessionId}`, 300, JSON.stringify({
        user_id: user.id,
        email: user.email,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: Date.now()
      }));

      return NextResponse.json({
        success: true,
        requires_2fa: true,
        temp_session_id: tempSessionId,
        message: 'Vui lòng nhập mã xác thực 2FA'
      });
    }

    // Check if security verification is required
    if (isSuspicious) {
      await logSecurityIncident('suspicious_login', {
        user_id: user.id,
        email: user.email,
        ip_address: ipAddress,
        user_agent: userAgent
      });

      return NextResponse.json({
        success: true,
        requires_security_verification: true,
        message: 'Phát hiện hoạt động đáng nghi. Cần xác thực bổ sung.'
      });
    }

    // Successful login
    const loginResult = await completeLogin(user, ipAddress, userAgent, validatedData.remember_me);
    
    // Clear rate limiting
    await redis.del(rateLimitKey);
    
    // Update security metrics
    await updateSecurityMetrics('session_created', { userId: user.id });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      session: loginResult.session,
      message: 'Đăng nhập thành công'
    });

  } catch (error: any) {
    console.error('Admin login error:', error);
    
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

// Helper function to complete login process
async function completeLogin(user: any, ipAddress: string, userAgent: string, rememberMe: boolean) {
  const sessionId = generateSessionId();
  const expiresAt = new Date();
  
  if (rememberMe) {
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
  } else {
    expiresAt.setHours(expiresAt.getHours() + 8); // 8 hours
  }

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
    throw new Error('Failed to create session');
  }

  // Store session in Redis
  await redis.setex(`session:${sessionId}`, 
    Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    JSON.stringify({
      user_id: user.id,
      email: user.email,
      role: user.role,
      session_id: sessionId,
      created_at: new Date().toISOString()
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

  // Log successful login
  await supabase.from('audit_logs').insert({
    action: 'admin_login_success',
    resource_type: 'authentication',
    user_id: user.id,
    user_name: user.full_name,
    user_email: user.email,
    user_role: user.role,
    ip_address: ipAddress,
    user_agent: userAgent,
    location: await getLocationFromIP(ipAddress),
    session_id: sessionId,
    details: {
      login_method: 'password',
      remember_me: rememberMe,
      device_type: getDeviceType(userAgent)
    },
    status: 'success',
    timestamp: new Date().toISOString()
  });

  return { session, sessionId };
}

// Helper function to handle failed login
async function handleFailedLogin(userId: string, email: string, ipAddress: string, userAgent: string) {
  // Increment failed attempts
  const { data: user } = await supabase
    .from('profiles')
    .select('failed_login_attempts')
    .eq('id', userId)
    .single();

  const failedAttempts = (user?.failed_login_attempts || 0) + 1;
  const shouldLock = failedAttempts >= 5;

  await supabase
    .from('profiles')
    .update({
      failed_login_attempts: failedAttempts,
      last_failed_login: new Date().toISOString(),
      ...(shouldLock && {
        account_locked: true,
        locked_at: new Date().toISOString()
      })
    })
    .eq('id', userId);

  // Log failed login
  await logFailedLogin(email, ipAddress, userAgent, 'INVALID_PASSWORD', {
    attempt_number: failedAttempts,
    account_locked: shouldLock
  });

  if (shouldLock) {
    await logSecurityIncident('account_locked', {
      user_id: userId,
      email,
      ip_address: ipAddress,
      failed_attempts: failedAttempts
    });
  }
}

// Helper function to increment rate limiting
async function incrementLoginAttempts(ipAddress: string) {
  const key = `login_attempts:${ipAddress}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 900); // 15 minutes
  }
}

// Helper function to log failed login
async function logFailedLogin(email: string, ipAddress: string, userAgent: string, reason: string, details: any = {}) {
  await supabase.from('audit_logs').insert({
    action: 'admin_login_failed',
    resource_type: 'authentication',
    user_email: email,
    ip_address: ipAddress,
    user_agent: userAgent,
    location: await getLocationFromIP(ipAddress),
    details: {
      reason,
      ...details
    },
    status: 'failed',
    timestamp: new Date().toISOString()
  });
}

// Helper function to log security incidents
async function logSecurityIncident(type: string, details: any) {
  await supabase.from('security_incidents').insert({
    type: 'suspicious_activity',
    severity: 'medium',
    user_id: details.user_id,
    user_email: details.email,
    ip_address: details.ip_address,
    description: `Security incident: ${type}`,
    details,
    status: 'open',
    timestamp: new Date().toISOString()
  });
}

// Helper functions
function generateSessionId(): string {
  return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
