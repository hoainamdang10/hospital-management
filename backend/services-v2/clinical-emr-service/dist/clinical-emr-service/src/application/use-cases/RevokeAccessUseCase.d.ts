/**
 * RevokeAccessUseCase - Application Layer
 * Use case for revoking access to medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
export interface RevokeAccessRequest {
    recordId: string;
    revokedFrom: string;
    revokedBy: string;
    reason?: string;
}
export interface RevokeAccessResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        revokedFrom: string;
        revokedAt: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class RevokeAccessUseCase extends BaseHealthcareUseCase<RevokeAccessRequest, RevokeAccessResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    execute(request: RevokeAccessRequest): Promise<RevokeAccessResponse>;
    protected executeInternal(request: RevokeAccessRequest): Promise<RevokeAccessResponse>;
    validate(request: RevokeAccessRequest): Promise<ValidationResult>;
    authorize(request: RevokeAccessRequest, userId: string): Promise<boolean>;
    involvesPHI(request: RevokeAccessRequest): boolean;
    getPatientId(request: RevokeAccessRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=RevokeAccessUseCase.d.ts.map