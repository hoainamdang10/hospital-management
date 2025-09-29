import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/backend/lib/auth/server';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

// Validation schemas
const generateReportSchema = z.object({
  type: z.string().min(1),
  parameters: z.record(z.any()).optional(),
  format: z.enum(['json', 'csv', 'excel', 'pdf']).default('json')
});

// GET /api/admin/reports - List all reports
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
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('reports')
      .select('*')
      .order('generated_at', { ascending: false });

    // Apply filters
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    if (from) {
      query = query.gte('generated_at', from);
    }

    if (to) {
      query = query.lte('generated_at', to);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'reports_viewed',
      resource_type: 'report',
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: { category, from, to },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      reports: reports || []
    });

  } catch (error: any) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/reports/generate - Generate new report
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = generateReportSchema.parse(body);

    // Generate report based on type
    let reportData: any = {};
    let reportName = '';
    let reportDescription = '';
    let category = 'system';

    switch (validatedData.type) {
      case 'user_activity_report':
        reportData = await generateUserActivityReport(validatedData.parameters);
        reportName = 'Báo cáo Hoạt động Người dùng';
        reportDescription = 'Thống kê hoạt động của người dùng trong hệ thống';
        category = 'users';
        break;

      case 'security_summary_report':
        reportData = await generateSecuritySummaryReport(validatedData.parameters);
        reportName = 'Báo cáo Tổng hợp Bảo mật';
        reportDescription = 'Tổng hợp các sự cố và hoạt động bảo mật';
        category = 'security';
        break;

      case 'department_utilization_report':
        reportData = await generateDepartmentUtilizationReport(validatedData.parameters);
        reportName = 'Báo cáo Sử dụng Khoa/Phòng';
        reportDescription = 'Thống kê sử dụng các khoa/phòng trong bệnh viện';
        category = 'departments';
        break;

      case 'system_performance_report':
        reportData = await generateSystemPerformanceReport(validatedData.parameters);
        reportName = 'Báo cáo Hiệu suất Hệ thống';
        reportDescription = 'Thống kê hiệu suất và tài nguyên hệ thống';
        category = 'system';
        break;

      case 'comprehensive_system_report':
        reportData = await generateComprehensiveSystemReport(validatedData.parameters);
        reportName = 'Báo cáo Tổng hợp Hệ thống';
        reportDescription = 'Báo cáo tổng hợp toàn diện về hệ thống';
        category = 'system';
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown report type' },
          { status: 400 }
        );
    }

    // Save report to database
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        name: reportName,
        description: reportDescription,
        category,
        type: 'chart',
        data: reportData,
        parameters: validatedData.parameters || {},
        generated_by: user.id,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report creation error:', reportError);
      return NextResponse.json(
        { error: 'Failed to save report' },
        { status: 500 }
      );
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'report_generated',
      resource_type: 'report',
      resource_id: report.id,
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: {
        reportType: validatedData.type,
        reportName,
        dataPoints: Array.isArray(reportData) ? reportData.length : Object.keys(reportData).length
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error: any) {
    console.error('Generate report error:', error);
    
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

// Helper functions to generate different types of reports
async function generateUserActivityReport(parameters: any) {
  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      id, full_name, role, created_at, last_login,
      audit_logs!inner(count)
    `);

  if (error) throw error;

  return users?.map(user => ({
    name: user.full_name,
    role: user.role,
    activity_count: user.audit_logs?.[0]?.count || 0,
    last_login: user.last_login,
    created_at: user.created_at
  })) || [];
}

async function generateSecuritySummaryReport(parameters: any) {
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: incidents, error } = await supabase
    .from('security_incidents')
    .select('type, severity, status, created_at')
    .gte('created_at', lastWeek.toISOString());

  if (error) throw error;

  // Group by type and severity
  const summary = incidents?.reduce((acc: any, incident) => {
    const key = `${incident.type}_${incident.severity}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}) || {};

  return Object.entries(summary).map(([key, count]) => ({
    name: key.replace('_', ' - '),
    value: count
  }));
}

async function generateDepartmentUtilizationReport(parameters: any) {
  const { data: departments, error } = await supabase
    .from('departments')
    .select(`
      name, capacity, current_patients, current_staff,
      appointments!inner(count)
    `);

  if (error) throw error;

  return departments?.map(dept => ({
    name: dept.name,
    capacity: dept.capacity,
    current_patients: dept.current_patients,
    current_staff: dept.current_staff,
    utilization_rate: Math.round((dept.current_patients / dept.capacity) * 100),
    appointments_count: dept.appointments?.[0]?.count || 0
  })) || [];
}

async function generateSystemPerformanceReport(parameters: any) {
  // Get system metrics from the last 24 hours
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const { data: apiLogs, error } = await supabase
    .from('audit_logs')
    .select('action, timestamp')
    .gte('timestamp', last24Hours.toISOString());

  if (error) throw error;

  // Group by hour
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(Date.now() - (23 - i) * 60 * 60 * 1000).getHours();
    const count = apiLogs?.filter(log => 
      new Date(log.timestamp).getHours() === hour
    ).length || 0;

    return {
      hour: `${hour}:00`,
      requests: count
    };
  });

  return hourlyActivity;
}

async function generateComprehensiveSystemReport(parameters: any) {
  // Combine multiple metrics
  const [userActivity, securitySummary, departmentUtil, systemPerf] = await Promise.all([
    generateUserActivityReport(parameters),
    generateSecuritySummaryReport(parameters),
    generateDepartmentUtilizationReport(parameters),
    generateSystemPerformanceReport(parameters)
  ]);

  return {
    user_activity: userActivity.slice(0, 10),
    security_summary: securitySummary.slice(0, 10),
    department_utilization: departmentUtil.slice(0, 10),
    system_performance: systemPerf.slice(0, 24),
    generated_at: new Date().toISOString(),
    summary: {
      total_users: userActivity.length,
      security_incidents: securitySummary.reduce((sum, item) => sum + (item.value as number), 0),
      departments: departmentUtil.length,
      avg_utilization: Math.round(
        departmentUtil.reduce((sum, dept) => sum + dept.utilization_rate, 0) / departmentUtil.length
      )
    }
  };
}
