import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/backend/lib/auth/server';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

// Validation schemas
const createAuditLogSchema = z.object({
  action: z.string().min(1).max(100),
  resource_type: z.string().min(1).max(50),
  resource_id: z.string().optional(),
  details: z.record(z.any()).optional(),
  status: z.enum(['success', 'failed', 'warning']).default('success'),
  saga_id: z.string().optional(),
  operation_id: z.string().optional()
});

// GET /api/admin/audit-logs - List audit logs with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const search = searchParams.get('search') || '';
    const actionCategory = searchParams.get('action_category') || 'all';
    const status = searchParams.get('status') || 'all';
    const userFilter = searchParams.get('user') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        profiles!inner(full_name, email, role)
      `, { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`
        action.ilike.%${search}%,
        resource_type.ilike.%${search}%,
        user_name.ilike.%${search}%,
        user_email.ilike.%${search}%,
        ip_address.ilike.%${search}%
      `);
    }

    // Apply action category filter
    if (actionCategory !== 'all') {
      const categoryActions = getCategoryActions(actionCategory);
      if (categoryActions.length > 0) {
        query = query.in('action', categoryActions);
      }
    }

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply user filter
    if (userFilter) {
      query = query.or(`
        user_name.ilike.%${userFilter}%,
        user_email.ilike.%${userFilter}%
      `);
    }

    // Apply date range filter
    if (from) {
      query = query.gte('timestamp', from);
    }
    if (to) {
      query = query.lte('timestamp', to);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Audit logs query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    // Transform data to include user information
    const transformedLogs = logs?.map(log => ({
      ...log,
      user_name: log.profiles?.full_name || log.user_name,
      user_email: log.profiles?.email || log.user_email,
      user_role: log.profiles?.role || log.user_role
    })) || [];

    return NextResponse.json({
      success: true,
      logs: transformedLogs,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/audit-logs - Create audit log entry
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createAuditLogSchema.parse(body);

    // Get location from IP (simplified - in production use a geolocation service)
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const location = await getLocationFromIP(ipAddress);

    const auditLogData = {
      action: validatedData.action,
      resource_type: validatedData.resource_type,
      resource_id: validatedData.resource_id,
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      ip_address: ipAddress,
      user_agent: userAgent,
      location: location,
      details: validatedData.details || {},
      status: validatedData.status,
      saga_id: validatedData.saga_id,
      operation_id: validatedData.operation_id,
      session_id: request.headers.get('x-session-id') || 'unknown',
      timestamp: new Date().toISOString()
    };

    const { data: auditLog, error } = await supabase
      .from('audit_logs')
      .insert(auditLogData)
      .select()
      .single();

    if (error) {
      console.error('Audit log creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create audit log' },
        { status: 500 }
      );
    }

    // Check for suspicious activity patterns
    await checkSuspiciousActivity(user.id, ipAddress, validatedData.action);

    return NextResponse.json({
      success: true,
      auditLog
    });

  } catch (error: any) {
    console.error('Create audit log error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get actions by category
function getCategoryActions(category: string): string[] {
  const categoryMap: Record<string, string[]> = {
    user_management: [
      'user_created', 'user_updated', 'user_deleted', 'user_activated', 'user_deactivated',
      'role_assigned', 'role_removed', 'password_reset', 'profile_updated'
    ],
    security: [
      'login_success', 'login_failed', 'logout', 'password_changed', 'two_factor_enabled',
      'two_factor_disabled', 'account_locked', 'account_unlocked', 'permission_granted',
      'permission_revoked', 'security_incident', 'suspicious_activity'
    ],
    system_config: [
      'config_updated', 'system_setting_changed', 'maintenance_mode_enabled',
      'maintenance_mode_disabled', 'backup_created', 'backup_restored'
    ],
    data_access: [
      'data_exported', 'data_imported', 'record_viewed', 'record_created',
      'record_updated', 'record_deleted', 'bulk_operation'
    ],
    authentication: [
      'login_success', 'login_failed', 'logout', 'session_created',
      'session_destroyed', 'token_refreshed', 'password_reset_requested'
    ]
  };

  return categoryMap[category] || [];
}

// Helper function to get location from IP (simplified)
async function getLocationFromIP(ipAddress: string): Promise<string> {
  try {
    // In production, use a proper geolocation service like MaxMind or IPGeolocation
    if (ipAddress === 'unknown' || ipAddress.startsWith('127.') || ipAddress.startsWith('192.168.')) {
      return 'Local Network';
    }

    // For demo purposes, return a placeholder
    return 'Vietnam'; // Replace with actual geolocation lookup
  } catch (error) {
    console.error('Geolocation error:', error);
    return 'Unknown Location';
  }
}

// Helper function to check for suspicious activity patterns
async function checkSuspiciousActivity(userId: string, ipAddress: string, action: string) {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Check for rapid successive actions
    const { data: recentActions, error } = await supabase
      .from('audit_logs')
      .select('id, action, timestamp')
      .eq('user_id', userId)
      .gte('timestamp', fiveMinutesAgo.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Suspicious activity check error:', error);
      return;
    }

    // Flag if more than 20 actions in 5 minutes
    if (recentActions && recentActions.length > 20) {
      await supabase.from('security_incidents').insert({
        type: 'suspicious_activity',
        severity: 'medium',
        user_id: userId,
        ip_address: ipAddress,
        description: `Rapid successive actions detected: ${recentActions.length} actions in 5 minutes`,
        details: {
          action_count: recentActions.length,
          time_window: '5_minutes',
          recent_actions: recentActions.slice(0, 10).map(a => a.action)
        },
        status: 'open',
        timestamp: now.toISOString()
      });
    }

    // Check for failed login attempts
    if (action === 'login_failed') {
      const { data: failedLogins, error: failedError } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('action', 'login_failed')
        .eq('ip_address', ipAddress)
        .gte('timestamp', new Date(now.getTime() - 15 * 60 * 1000).toISOString());

      if (!failedError && failedLogins && failedLogins.length >= 5) {
        await supabase.from('security_incidents').insert({
          type: 'failed_login',
          severity: 'high',
          user_id: userId,
          ip_address: ipAddress,
          description: `Multiple failed login attempts: ${failedLogins.length} attempts in 15 minutes`,
          details: {
            attempt_count: failedLogins.length,
            time_window: '15_minutes'
          },
          status: 'open',
          timestamp: now.toISOString()
        });
      }
    }

  } catch (error) {
    console.error('Suspicious activity check error:', error);
  }
}

// Helper function for HIPAA compliance logging
export async function logHIPAAAccess(
  userId: string,
  patientId: string,
  accessType: 'view' | 'create' | 'update' | 'delete',
  resourceType: string,
  details: any = {}
) {
  try {
    await supabase.from('audit_logs').insert({
      action: `hipaa_${accessType}_${resourceType}`,
      resource_type: 'patient_data',
      resource_id: patientId,
      user_id: userId,
      details: {
        ...details,
        hipaa_compliant: true,
        access_type: accessType,
        patient_id: patientId
      },
      status: 'success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('HIPAA logging error:', error);
  }
}

// Helper function for saga transaction logging
export async function logSagaTransaction(
  sagaId: string,
  operationId: string,
  step: string,
  status: 'started' | 'completed' | 'failed' | 'compensated',
  details: any = {}
) {
  try {
    await supabase.from('audit_logs').insert({
      action: `saga_${step}_${status}`,
      resource_type: 'saga_transaction',
      resource_id: sagaId,
      saga_id: sagaId,
      operation_id: operationId,
      details: {
        ...details,
        saga_step: step,
        saga_status: status
      },
      status: status === 'failed' ? 'failed' : 'success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Saga logging error:', error);
  }
}
