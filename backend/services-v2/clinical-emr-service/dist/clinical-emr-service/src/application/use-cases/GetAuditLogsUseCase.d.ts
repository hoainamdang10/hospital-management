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
export declare class GetAuditLogsUseCase extends BaseHealthcareUseCase<GetAuditLogsRequest, GetAuditLogsResponse> {
    private readonly auditLogService;
    constructor(auditLogService: IAuditLogService);
    execute(request: GetAuditLogsRequest): Promise<GetAuditLogsResponse>;
    protected executeInternal(request: GetAuditLogsRequest): Promise<GetAuditLogsResponse>;
    validate(request: GetAuditLogsRequest): Promise<ValidationResult>;
    private isAuthorized;
    authorize(request: GetAuditLogsRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GetAuditLogsRequest): boolean;
    getPatientId(request: GetAuditLogsRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=GetAuditLogsUseCase.d.ts.map