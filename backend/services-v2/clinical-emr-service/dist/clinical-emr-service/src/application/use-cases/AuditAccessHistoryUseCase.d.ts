/**
 * AuditAccessHistoryUseCase - Application Layer
 * Use case for auditing access history of medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
export interface AuditAccessHistoryRequest {
    recordId: string;
    requestedBy: string;
    dateFrom?: string;
    dateTo?: string;
    accessType?: 'read' | 'write' | 'print' | 'export';
    accessedBy?: string;
}
export interface AuditAccessHistoryResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        accessLog: Array<{
            accessedAt: string;
            accessedBy: string;
            accessType: string;
            ipAddress?: string;
            userAgent?: string;
            purpose?: string;
        }>;
        summary: {
            totalAccesses: number;
            uniqueUsers: number;
            readAccesses: number;
            writeAccesses: number;
            printAccesses: number;
            exportAccesses: number;
            firstAccessAt?: string;
            lastAccessAt?: string;
        };
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class AuditAccessHistoryUseCase extends BaseHealthcareUseCase<AuditAccessHistoryRequest, AuditAccessHistoryResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    execute(request: AuditAccessHistoryRequest): Promise<AuditAccessHistoryResponse>;
    protected executeInternal(request: AuditAccessHistoryRequest): Promise<AuditAccessHistoryResponse>;
    validate(request: AuditAccessHistoryRequest): Promise<ValidationResult>;
    authorize(request: AuditAccessHistoryRequest, userId: string): Promise<boolean>;
    involvesPHI(request: AuditAccessHistoryRequest): boolean;
    getPatientId(request: AuditAccessHistoryRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=AuditAccessHistoryUseCase.d.ts.map