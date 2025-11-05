/**
 * GetAuditLogsUseCase - Application Layer
 * HIPAA Compliance: System-wide PHI access audit logs
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IAuditLogService } from '../../domain/services/IAuditLogService';

export interface GetAuditLogsRequest {
  patientId?: string;
  userId?: string;
  action?: 'read' | 'write' | 'print' | 'export' | 'delete' | 'update';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  requestedBy: string;
  requestedByRole: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  patientId?: string;
  patientName?: string;
  ipAddress?: string;
  userAgent?: string;
  purpose?: string;
  outcome: 'success' | 'failure';
  details?: string;
}

export interface GetAuditLogsResponse {
  success: boolean;
  message: string;
  data?: {
    logs: AuditLogEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      totalAccesses: number;
      uniqueUsers: number;
      uniquePatients: number;
      byAction: Record<string, number>;
      byOutcome: {
        success: number;
        failure: number;
      };
    };
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetAuditLogsUseCase extends BaseHealthcareUseCase<GetAuditLogsRequest, GetAuditLogsResponse> {
  constructor(
    private readonly auditLogService: IAuditLogService
  ) {
    super();
  }

  override async execute(request: GetAuditLogsRequest): Promise<GetAuditLogsResponse> {
    const validation = await this.validate(request);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }

    // Authorization check
    if (!this.isAuthorized(request.requestedByRole)) {
      return {
        success: false,
        message: 'Không có quyền truy cập audit logs',
        errors: [{ field: 'authorization', message: 'Unauthorized', code: 'FORBIDDEN' }]
      };
    }
    
    return await this.executeInternal(request);
  }

  protected async executeInternal(request: GetAuditLogsRequest): Promise<GetAuditLogsResponse> {
    try {
      const page = request.page || 1;
      const limit = Math.min(request.limit || 50, 100); // Max 100 per page
      const offset = (page - 1) * limit;

      // Build filter criteria
      const filters: any = {};
      if (request.patientId) filters.patientId = request.patientId;
      if (request.userId) filters.userId = request.userId;
      if (request.action) filters.action = request.action;
      if (request.startDate) filters.startDate = new Date(request.startDate);
      if (request.endDate) filters.endDate = new Date(request.endDate);

      // Get audit logs from service
      const result = await this.auditLogService.getAuditLogs(filters, limit, offset);

      // Calculate summary statistics
      const uniqueUsers = new Set(result.logs.map(log => log.userId)).size;
      const uniquePatients = new Set(result.logs.filter(log => log.patientId).map(log => log.patientId)).size;
      
      const byAction: Record<string, number> = {};
      result.logs.forEach(log => {
        byAction[log.action] = (byAction[log.action] || 0) + 1;
      });

      const successCount = result.logs.filter(log => log.outcome === 'success').length;
      const failureCount = result.logs.filter(log => log.outcome === 'failure').length;

      return {
        success: true,
        message: `Tìm thấy ${result.total} audit log entries`,
        data: {
          logs: result.logs,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          },
          summary: {
            totalAccesses: result.total,
            uniqueUsers,
            uniquePatients,
            byAction,
            byOutcome: {
              success: successCount,
              failure: failureCount
            }
          }
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy audit logs: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: GetAuditLogsRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.requestedBy) {
      errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });
    }

    if (!request.requestedByRole) {
      errors.push({ field: 'requestedByRole', message: 'RequestedByRole là bắt buộc', code: 'REQUIRED' });
    }

    // Validate date range
    if (request.startDate && request.endDate) {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      if (start > end) {
        errors.push({ field: 'dateRange', message: 'Start date phải trước end date', code: 'INVALID_RANGE' });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private isAuthorized(role: string): boolean {
    const authorizedRoles = ['super_admin', 'admin', 'compliance_officer'];
    return authorizedRoles.includes(role.toLowerCase());
  }

  async authorize(request: GetAuditLogsRequest, userId: string): Promise<boolean> {
    return this.isAuthorized(request.requestedByRole);
  }

  involvesPHI(request: GetAuditLogsRequest): boolean {
    return true;
  }

  getPatientId(request: GetAuditLogsRequest): string | null {
    return request.patientId || null;
  }

  getDescription(): string {
    return 'Lấy system-wide PHI access audit logs (HIPAA compliance)';
  }

  getRequiredPermissions(): string[] {
    return ['audit:read', 'compliance:view'];
  }
}

