/**
 * GrantAccessUseCase - Application Layer
 * Use case for granting access to medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
export interface GrantAccessRequest {
    recordId: string;
    grantedTo: string;
    grantedBy: string;
    accessLevel: 'read' | 'write' | 'full';
    expiresAt?: Date;
    purpose?: string;
}
export interface GrantAccessResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        grantedTo: string;
        accessLevel: string;
        grantedAt: string;
        expiresAt?: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class GrantAccessUseCase extends BaseHealthcareUseCase<GrantAccessRequest, GrantAccessResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    execute(request: GrantAccessRequest): Promise<GrantAccessResponse>;
    protected executeInternal(request: GrantAccessRequest): Promise<GrantAccessResponse>;
    validate(request: GrantAccessRequest): Promise<ValidationResult>;
    authorize(request: GrantAccessRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GrantAccessRequest): boolean;
    getPatientId(request: GrantAccessRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=GrantAccessUseCase.d.ts.map