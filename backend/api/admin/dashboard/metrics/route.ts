import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/backend/lib/auth/server';
import { supabase } from '@/backend/lib/supabase';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// GET /api/admin/dashboard/metrics - Consolidated metrics for enhanced admin dashboard
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
    const category = searchParams.get('category') || 'all';

    // Get consolidated metrics based on category
    let metrics = {};

    if (category === 'all' || category === 'security') {
      const securityMetrics = await getSecurityMetrics();
      metrics = { ...metrics, security: securityMetrics };
    }

    if (category === 'all' || category === 'orchestration') {
      const orchestrationMetrics = await getOrchestrationMetrics();
      metrics = { ...metrics, orchestration: orchestrationMetrics };
    }

    if (category === 'all' || category === 'system') {
      const systemMetrics = await getSystemMetrics();
      metrics = { ...metrics, system: systemMetrics };
    }

    if (category === 'all' || category === 'hospital') {
      const hospitalMetrics = await getHospitalMetrics();
      metrics = { ...metrics, hospital: hospitalMetrics };
    }

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
      category
    });

  } catch (error: any) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}

// Security metrics (from existing security/metrics endpoint)
async function getSecurityMetrics() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get active sessions from Redis
    const activeSessionsKeys = await redis.keys('session:*');
    const activeSessions = activeSessionsKeys.length;

    // Get failed login attempts today
    const { data: failedLogins } = await supabase
      .from('audit_logs')
      .select('id')
      .eq('action', 'login_failed')
      .gte('timestamp', todayISO);

    // Get locked accounts
    const { data: lockedAccounts } = await supabase
      .from('profiles')
      .select('id')
      .eq('account_locked', true);

    // Get security incidents today
    const { data: securityIncidents } = await supabase
      .from('security_incidents')
      .select('id, severity')
      .gte('timestamp', todayISO);

    // Calculate security score
    const securityScore = calculateSecurityScore({
      failedLogins: failedLogins?.length || 0,
      lockedAccounts: lockedAccounts?.length || 0,
      securityIncidents: securityIncidents?.length || 0
    });

    return {
      active_sessions: activeSessions,
      failed_logins_today: failedLogins?.length || 0,
      locked_accounts: lockedAccounts?.length || 0,
      security_incidents_today: securityIncidents?.length || 0,
      security_score: securityScore,
      critical_incidents: securityIncidents?.filter(i => i.severity === 'critical').length || 0,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Security metrics error:', error);
    return {
      active_sessions: 0,
      failed_logins_today: 0,
      locked_accounts: 0,
      security_incidents_today: 0,
      security_score: 0,
      critical_incidents: 0,
      last_updated: new Date().toISOString()
    };
  }
}

// Orchestration metrics (new)
async function getOrchestrationMetrics() {
  try {
    // Get active operations from Redis or database
    const activeOperationsKeys = await redis.keys('operation:*');
    const activeOperations = activeOperationsKeys.length;

    // Get completed operations today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: completedOperations } = await supabase
      .from('audit_logs')
      .select('id, status')
      .like('action', '%_operation_%')
      .gte('timestamp', todayISO);

    const successfulOperations = completedOperations?.filter(op => op.status === 'success').length || 0;
    const failedOperations = completedOperations?.filter(op => op.status === 'failed').length || 0;
    const totalOperations = completedOperations?.length || 0;

    const successRate = totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 100;

    return {
      active_operations: activeOperations,
      completed_today: totalOperations,
      successful_operations: successfulOperations,
      failed_operations: failedOperations,
      success_rate: Math.round(successRate),
      avg_execution_time: 2.5, // seconds - placeholder
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Orchestration metrics error:', error);
    return {
      active_operations: 0,
      completed_today: 0,
      successful_operations: 0,
      failed_operations: 0,
      success_rate: 100,
      avg_execution_time: 0,
      last_updated: new Date().toISOString()
    };
  }
}

// System metrics (new)
async function getSystemMetrics() {
  try {
    // Get system health from various sources
    const systemHealth = {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      api_gateway: await checkAPIGatewayHealth(),
      microservices: await checkMicroservicesHealth()
    };

    const healthyServices = Object.values(systemHealth).filter(service => service.status === 'healthy').length;
    const totalServices = Object.keys(systemHealth).length;
    const systemScore = Math.round((healthyServices / totalServices) * 100);

    return {
      system_health: systemHealth,
      system_score: systemScore,
      uptime: '99.9%', // placeholder
      cpu_usage: 45, // placeholder
      memory_usage: 62, // placeholder
      storage_usage: 78, // placeholder
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('System metrics error:', error);
    return {
      system_health: {},
      system_score: 0,
      uptime: '0%',
      cpu_usage: 0,
      memory_usage: 0,
      storage_usage: 0,
      last_updated: new Date().toISOString()
    };
  }
}

// Hospital metrics (new)
async function getHospitalMetrics() {
  try {
    // Get hospital operational metrics
    const { data: patients } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'patient');

    const { data: doctors } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'doctor');

    const { data: departments } = await supabase
      .from('departments')
      .select('id');

    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, status');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: appointmentsToday } = await supabase
      .from('appointments')
      .select('id, status')
      .gte('appointment_date', todayISO)
      .lt('appointment_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

    const occupiedRooms = rooms?.filter(room => room.status === 'occupied').length || 0;
    const totalRooms = rooms?.length || 0;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      total_patients: patients?.length || 0,
      total_doctors: doctors?.length || 0,
      total_departments: departments?.length || 0,
      total_rooms: totalRooms,
      occupied_rooms: occupiedRooms,
      occupancy_rate: occupancyRate,
      appointments_today: appointmentsToday?.length || 0,
      confirmed_appointments: appointmentsToday?.filter(apt => apt.status === 'confirmed').length || 0,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Hospital metrics error:', error);
    return {
      total_patients: 0,
      total_doctors: 0,
      total_departments: 0,
      total_rooms: 0,
      occupied_rooms: 0,
      occupancy_rate: 0,
      appointments_today: 0,
      confirmed_appointments: 0,
      last_updated: new Date().toISOString()
    };
  }
}

// Helper functions
function calculateSecurityScore(metrics: any): number {
  let score = 100;
  
  // Deduct points for security issues
  score -= Math.min(metrics.failedLogins * 2, 20);
  score -= Math.min(metrics.lockedAccounts * 5, 30);
  score -= Math.min(metrics.securityIncidents * 10, 50);
  
  return Math.max(score, 0);
}

async function checkDatabaseHealth() {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    return { status: error ? 'error' : 'healthy', uptime: '99.9%' };
  } catch (error) {
    return { status: 'error', uptime: '0%' };
  }
}

async function checkRedisHealth() {
  try {
    await redis.ping();
    return { status: 'healthy', uptime: '99.8%' };
  } catch (error) {
    return { status: 'error', uptime: '0%' };
  }
}

async function checkAPIGatewayHealth() {
  // Placeholder - would check API Gateway health
  return { status: 'healthy', uptime: '99.9%' };
}

async function checkMicroservicesHealth() {
  // Placeholder - would check microservices health
  return { status: 'warning', uptime: '98.5%' };
}
