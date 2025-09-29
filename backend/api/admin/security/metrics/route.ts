import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/backend/lib/auth/server';
import { supabase } from '@/backend/lib/supabase';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// GET /api/admin/security/metrics - Get security metrics
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get active sessions from Redis
    const activeSessionsKeys = await redis.keys('session:*');
    const activeSessions = activeSessionsKeys.length;

    // Get failed login attempts today
    const { data: failedLogins, error: failedLoginsError } = await supabase
      .from('audit_logs')
      .select('id')
      .eq('action', 'login_failed')
      .gte('timestamp', todayISO);

    if (failedLoginsError) {
      console.error('Failed logins query error:', failedLoginsError);
    }

    // Get locked accounts
    const { data: lockedAccounts, error: lockedAccountsError } = await supabase
      .from('profiles')
      .select('id')
      .eq('account_locked', true);

    if (lockedAccountsError) {
      console.error('Locked accounts query error:', lockedAccountsError);
    }

    // Get security incidents today
    const { data: securityIncidents, error: securityIncidentsError } = await supabase
      .from('security_incidents')
      .select('id')
      .gte('timestamp', todayISO);

    if (securityIncidentsError) {
      console.error('Security incidents query error:', securityIncidentsError);
    }

    // Get password policy violations
    const { data: policyViolations, error: policyViolationsError } = await supabase
      .from('audit_logs')
      .select('id')
      .eq('action', 'password_policy_violation')
      .gte('timestamp', todayISO);

    if (policyViolationsError) {
      console.error('Policy violations query error:', policyViolationsError);
    }

    // Get 2FA statistics
    const { data: totalUsers, error: totalUsersError } = await supabase
      .from('profiles')
      .select('id, two_factor_enabled');

    if (totalUsersError) {
      console.error('Total users query error:', totalUsersError);
    }

    const twoFactorEnabledUsers = totalUsers?.filter(user => user.two_factor_enabled).length || 0;

    // Get suspicious activities
    const { data: suspiciousActivities, error: suspiciousActivitiesError } = await supabase
      .from('audit_logs')
      .select('id')
      .eq('action', 'suspicious_activity')
      .gte('timestamp', todayISO);

    if (suspiciousActivitiesError) {
      console.error('Suspicious activities query error:', suspiciousActivitiesError);
    }

    const metrics = {
      active_sessions: activeSessions,
      failed_login_attempts_today: failedLogins?.length || 0,
      locked_accounts: lockedAccounts?.length || 0,
      security_incidents_today: securityIncidents?.length || 0,
      password_policy_violations: policyViolations?.length || 0,
      two_factor_enabled_users: twoFactorEnabledUsers,
      total_users: totalUsers?.length || 0,
      suspicious_activities: suspiciousActivities?.length || 0
    };

    // Cache metrics for 5 minutes
    await redis.setex('security_metrics', 300, JSON.stringify(metrics));

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'security_metrics_viewed',
      resource_type: 'security_metrics',
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: metrics,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(metrics);

  } catch (error: any) {
    console.error('Security metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security metrics' },
      { status: 500 }
    );
  }
}

// Real-time security metrics update function
export async function updateSecurityMetrics(eventType: string, data: any) {
  try {
    // Get current metrics from cache
    const cachedMetrics = await redis.get('security_metrics');
    let metrics = cachedMetrics ? JSON.parse(cachedMetrics) : {};

    // Update metrics based on event type
    switch (eventType) {
      case 'session_created':
        metrics.active_sessions = (metrics.active_sessions || 0) + 1;
        break;
      case 'session_destroyed':
        metrics.active_sessions = Math.max(0, (metrics.active_sessions || 0) - 1);
        break;
      case 'login_failed':
        metrics.failed_login_attempts_today = (metrics.failed_login_attempts_today || 0) + 1;
        break;
      case 'account_locked':
        metrics.locked_accounts = (metrics.locked_accounts || 0) + 1;
        break;
      case 'account_unlocked':
        metrics.locked_accounts = Math.max(0, (metrics.locked_accounts || 0) - 1);
        break;
      case 'security_incident':
        metrics.security_incidents_today = (metrics.security_incidents_today || 0) + 1;
        break;
      case 'two_factor_enabled':
        metrics.two_factor_enabled_users = (metrics.two_factor_enabled_users || 0) + 1;
        break;
      case 'two_factor_disabled':
        metrics.two_factor_enabled_users = Math.max(0, (metrics.two_factor_enabled_users || 0) - 1);
        break;
      case 'suspicious_activity':
        metrics.suspicious_activities = (metrics.suspicious_activities || 0) + 1;
        break;
    }

    // Update cache
    await redis.setex('security_metrics', 300, JSON.stringify(metrics));

    // Broadcast update via WebSocket (if implemented)
    // await broadcastSecurityUpdate('metrics_update', metrics);

    return metrics;
  } catch (error) {
    console.error('Update security metrics error:', error);
    return null;
  }
}

// Helper function to detect suspicious activity
export async function detectSuspiciousActivity(userId: string, ipAddress: string, userAgent: string) {
  try {
    const suspiciousIndicators = [];

    // Check for multiple failed logins from same IP
    const recentFailedLogins = await supabase
      .from('audit_logs')
      .select('id')
      .eq('action', 'login_failed')
      .eq('ip_address', ipAddress)
      .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Last 15 minutes

    if (recentFailedLogins.data && recentFailedLogins.data.length >= 5) {
      suspiciousIndicators.push('multiple_failed_logins');
    }

    // Check for login from unusual location
    const userRecentLogins = await supabase
      .from('audit_logs')
      .select('ip_address, location')
      .eq('user_id', userId)
      .eq('action', 'login_success')
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .limit(10);

    if (userRecentLogins.data) {
      const knownIPs = userRecentLogins.data.map(login => login.ip_address);
      if (!knownIPs.includes(ipAddress)) {
        suspiciousIndicators.push('unusual_location');
      }
    }

    // Check for unusual user agent
    const userRecentSessions = await supabase
      .from('audit_logs')
      .select('user_agent')
      .eq('user_id', userId)
      .eq('action', 'login_success')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .limit(5);

    if (userRecentSessions.data) {
      const knownUserAgents = userRecentSessions.data.map(session => session.user_agent);
      if (!knownUserAgents.includes(userAgent)) {
        suspiciousIndicators.push('unusual_device');
      }
    }

    // Check for rapid successive logins
    const recentLogins = await supabase
      .from('audit_logs')
      .select('timestamp')
      .eq('user_id', userId)
      .eq('action', 'login_success')
      .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order('timestamp', { ascending: false });

    if (recentLogins.data && recentLogins.data.length >= 3) {
      suspiciousIndicators.push('rapid_successive_logins');
    }

    // If suspicious activity detected, create incident
    if (suspiciousIndicators.length > 0) {
      await supabase.from('security_incidents').insert({
        type: 'suspicious_activity',
        severity: suspiciousIndicators.length >= 2 ? 'high' : 'medium',
        user_id: userId,
        ip_address: ipAddress,
        description: `Suspicious activity detected: ${suspiciousIndicators.join(', ')}`,
        details: {
          indicators: suspiciousIndicators,
          user_agent: userAgent
        },
        status: 'open',
        timestamp: new Date().toISOString()
      });

      // Update metrics
      await updateSecurityMetrics('suspicious_activity', { userId, indicators: suspiciousIndicators });

      return true;
    }

    return false;
  } catch (error) {
    console.error('Suspicious activity detection error:', error);
    return false;
  }
}

// Helper function to enforce password policy
export async function validatePasswordPolicy(password: string, userId?: string) {
  try {
    // Get password policy from database
    const { data: policy, error } = await supabase
      .from('system_configuration')
      .select('value')
      .eq('key', 'password_policy')
      .single();

    if (error || !policy) {
      // Default policy
      const defaultPolicy = {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_symbols: true,
        max_age_days: 90,
        history_count: 5
      };
      
      return validatePassword(password, defaultPolicy, userId);
    }

    return validatePassword(password, policy.value, userId);
  } catch (error) {
    console.error('Password policy validation error:', error);
    return { valid: false, errors: ['Password validation failed'] };
  }
}

function validatePassword(password: string, policy: any, userId?: string) {
  const errors = [];

  if (password.length < policy.min_length) {
    errors.push(`Password must be at least ${policy.min_length} characters long`);
  }

  if (policy.require_uppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (policy.require_lowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (policy.require_numbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (policy.require_symbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
