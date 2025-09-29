import { NextRequest, NextResponse } from 'next/server';
import { AdminOrchestrator } from '@/backend/services/admin-orchestrator/src/orchestrator/AdminOrchestrator';
import { getAuthenticatedUser } from '@/backend/lib/auth/server';
import { z } from 'zod';

// Enhanced validation schemas for Option 2
const enhancedCreateDoctorSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone_number: z.string().regex(/^0\d{9}$/),
  license_number: z.string().regex(/^VN-[A-Z]{2}-\d{4}$/),
  department_id: z.number().int().positive(),
  specialization: z.string().min(2).max(100),
  experience_years: z.number().int().min(0).max(50),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.number().int()
  })).optional(),
  // Enhanced coordination options
  coordination_options: z.object({
    enable_saga: z.boolean().default(true),
    enable_notifications: z.boolean().default(true),
    enable_audit_logging: z.boolean().default(true),
    retry_attempts: z.number().int().min(0).max(5).default(3),
    timeout_seconds: z.number().int().min(30).max(300).default(120)
  }).optional()
});

const bulkImportSchema = z.object({
  users: z.array(enhancedCreateDoctorSchema.omit({ coordination_options: true })),
  options: z.object({
    batch_size: z.number().int().min(1).max(50).default(10),
    skip_duplicates: z.boolean().default(true),
    send_welcome_emails: z.boolean().default(true),
    validate_only: z.boolean().default(false),
    enable_parallel_processing: z.boolean().default(true),
    max_concurrent_operations: z.number().int().min(1).max(10).default(3)
  }).optional()
});

const systemMaintenanceSchema = z.object({
  maintenance_type: z.enum(['database_cleanup', 'cache_refresh', 'service_restart', 'backup_creation']),
  options: z.object({
    services: z.array(z.string()).optional(),
    backup_type: z.enum(['full', 'incremental']).optional(),
    cleanup_older_than_days: z.number().int().min(1).max(365).optional(),
    maintenance_window_minutes: z.number().int().min(5).max(120).default(30)
  }).optional(),
  scheduled_at: z.string().datetime().optional(),
  coordination_options: z.object({
    enable_rollback: z.boolean().default(true),
    enable_health_checks: z.boolean().default(true),
    notification_channels: z.array(z.string()).default(['email', 'slack'])
  }).optional()
});

// Initialize orchestrator with enhanced capabilities
let orchestrator: AdminOrchestrator;

// POST /api/admin/orchestration/operations - Create enhanced admin operation
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
    const { type, payload, coordination_options } = body;

    // Enhanced validation with coordination options
    let validatedPayload: any;
    switch (type) {
      case 'create_doctor':
        validatedPayload = enhancedCreateDoctorSchema.parse(payload);
        break;
      case 'bulk_user_import':
        validatedPayload = bulkImportSchema.parse(payload);
        break;
      case 'system_maintenance':
        validatedPayload = systemMaintenanceSchema.parse(payload);
        break;
      case 'cross_service_sync':
        validatedPayload = z.object({
          sync_type: z.enum(['user_data', 'department_data', 'appointment_data']),
          services: z.array(z.string()),
          options: z.record(z.any()).optional()
        }).parse(payload);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown operation type: ${type}` },
          { status: 400 }
        );
    }

    // Create enhanced operation with coordination metadata
    const operation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload: validatedPayload,
      userId: user.id,
      timestamp: new Date(),
      status: 'pending' as const,
      progress: 0,
      metadata: {
        userEmail: user.email,
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        coordination_enabled: true,
        saga_enabled: coordination_options?.enable_saga ?? true,
        real_time_updates: true,
        estimated_duration: getEstimatedDuration(type, validatedPayload)
      }
    };

    // Execute operation with enhanced orchestration
    const result = await orchestrator.executeOperation(operation);

    // Return enhanced response with real-time tracking info
    return NextResponse.json({
      success: true,
      operationId: operation.id,
      result,
      tracking: {
        websocket_url: `/api/admin/orchestration/operations/${operation.id}/ws`,
        status_endpoint: `/api/admin/orchestration/operations/${operation.id}`,
        control_endpoint: `/api/admin/orchestration/operations/${operation.id}/control`
      },
      estimated_completion: result.estimatedCompletion,
      message: 'Enhanced operation started with real-time tracking'
    });

  } catch (error: any) {
    console.error('Enhanced admin operation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Enhanced validation failed', 
          details: error.errors,
          suggestion: 'Check coordination_options and enhanced parameters'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Enhanced orchestration error',
        message: error.message,
        troubleshooting: {
          check_saga_coordinator: true,
          check_service_health: true,
          check_redis_connection: true
        }
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/orchestration/operations - List operations with enhanced filtering
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
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const saga_status = searchParams.get('saga_status');
    const has_errors = searchParams.get('has_errors') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Enhanced filtering options
    const filters = {
      status,
      type,
      saga_status,
      has_errors,
      limit,
      offset,
      userId: user.role === 'admin' ? user.id : undefined,
      include_saga_details: true,
      include_performance_metrics: true
    };

    const operations = await getEnhancedOperations(filters);

    return NextResponse.json({
      success: true,
      operations,
      pagination: {
        limit,
        offset,
        total: operations.length,
        has_more: operations.length === limit
      },
      summary: {
        total_active: operations.filter(op => ['pending', 'running'].includes(op.status)).length,
        total_completed: operations.filter(op => op.status === 'completed').length,
        total_failed: operations.filter(op => op.status === 'failed').length,
        avg_execution_time: calculateAverageExecutionTime(operations)
      }
    });

  } catch (error: any) {
    console.error('Get enhanced operations error:', error);
    return NextResponse.json(
      { error: 'Enhanced operations retrieval failed' },
      { status: 500 }
    );
  }
}

// Helper functions for enhanced functionality
function getEstimatedDuration(type: string, payload: any): number {
  const baseDurations: Record<string, number> = {
    'create_doctor': 30, // seconds
    'bulk_user_import': payload.users?.length * 2 || 60,
    'system_maintenance': 120,
    'cross_service_sync': 90
  };
  
  return baseDurations[type] || 60;
}

async function getEnhancedOperations(filters: any): Promise<any[]> {
  // Implementation would query Redis/Database with enhanced filtering
  // Including saga details, performance metrics, error details
  return [];
}

function calculateAverageExecutionTime(operations: any[]): number {
  const completedOps = operations.filter(op => 
    op.status === 'completed' && op.execution_time
  );
  
  if (completedOps.length === 0) return 0;
  
  const totalTime = completedOps.reduce((sum, op) => sum + op.execution_time, 0);
  return Math.round(totalTime / completedOps.length);
}

// WebSocket endpoint for real-time operation updates
export async function WEBSOCKET(request: NextRequest) {
  // Enhanced WebSocket implementation with:
  // - Real-time saga step updates
  // - Progress tracking
  // - Error notifications
  // - Performance metrics
  // - Compensation status
}
