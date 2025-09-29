import { NextRequest, NextResponse } from 'next/server';
import { AdminOrchestrator, AdminOperation } from '@/backend/services/admin-orchestrator/src/orchestrator/AdminOrchestrator';
import { getAuthenticatedUser } from '@/backend/lib/auth/server';
import { z } from 'zod';

// Validation schemas
const createDoctorSchema = z.object({
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
  })).optional()
});

const bulkImportSchema = z.object({
  users: z.array(createDoctorSchema),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    sendWelcomeEmails: z.boolean().default(true),
    validateOnly: z.boolean().default(false)
  }).optional()
});

const systemMaintenanceSchema = z.object({
  maintenanceType: z.enum(['database_cleanup', 'cache_refresh', 'service_restart']),
  options: z.record(z.any()).optional(),
  scheduledAt: z.string().datetime().optional()
});

// Initialize orchestrator (in real implementation, this would be dependency injected)
let orchestrator: AdminOrchestrator;

// POST /api/admin/operations - Create new admin operation
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const user = await getAuthenticatedUser(request);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, payload } = body;

    // Validate operation type and payload
    let validatedPayload: any;
    switch (type) {
      case 'create_doctor':
        validatedPayload = createDoctorSchema.parse(payload);
        break;
      case 'bulk_user_import':
        validatedPayload = bulkImportSchema.parse(payload);
        break;
      case 'system_maintenance':
        validatedPayload = systemMaintenanceSchema.parse(payload);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown operation type: ${type}` },
          { status: 400 }
        );
    }

    // Create operation
    const operation: AdminOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload: validatedPayload,
      userId: user.id,
      timestamp: new Date(),
      status: 'pending',
      progress: 0,
      metadata: {
        userEmail: user.email,
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    };

    // Execute operation asynchronously
    const result = await orchestrator.executeOperation(operation);

    return NextResponse.json({
      success: true,
      operationId: operation.id,
      result,
      message: 'Operation completed successfully'
    });

  } catch (error: any) {
    console.error('Admin operation error:', error);
    
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
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/operations - List admin operations
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get operations from Redis/Database
    // This is a simplified implementation
    const operations = await getOperations({
      status,
      type,
      limit,
      offset,
      userId: user.role === 'admin' ? user.id : undefined // Superadmin sees all
    });

    return NextResponse.json({
      success: true,
      operations,
      pagination: {
        limit,
        offset,
        total: operations.length
      }
    });

  } catch (error: any) {
    console.error('Get operations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/operations/[id] - Get specific operation
export async function GET_BY_ID(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const operationId = params.id;
    const operation = await getOperationById(operationId);

    if (!operation) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    // Check if user can access this operation
    if (user.role === 'admin' && operation.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      operation
    });

  } catch (error: any) {
    console.error('Get operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/operations/[id] - Cancel operation
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const operationId = params.id;
    const operation = await getOperationById(operationId);

    if (!operation) {
      return NextResponse.json(
        { error: 'Operation not found' },
        { status: 404 }
      );
    }

    // Check if operation can be cancelled
    if (!['pending', 'running'].includes(operation.status)) {
      return NextResponse.json(
        { error: 'Operation cannot be cancelled' },
        { status: 400 }
      );
    }

    // Cancel operation
    await cancelOperation(operationId);

    return NextResponse.json({
      success: true,
      message: 'Operation cancelled successfully'
    });

  } catch (error: any) {
    console.error('Cancel operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions (these would be implemented with actual data access)
async function getOperations(filters: {
  status?: string | null;
  type?: string | null;
  limit: number;
  offset: number;
  userId?: string;
}): Promise<AdminOperation[]> {
  // Implementation would query Redis/Database
  return [];
}

async function getOperationById(operationId: string): Promise<AdminOperation | null> {
  // Implementation would query Redis/Database
  return null;
}

async function cancelOperation(operationId: string): Promise<void> {
  // Implementation would cancel the operation and trigger compensation if needed
}

// WebSocket endpoint for real-time operation updates
export async function WEBSOCKET(request: NextRequest) {
  // Implementation for WebSocket connection to provide real-time updates
  // This would use Next.js WebSocket support or a separate WebSocket server
}
