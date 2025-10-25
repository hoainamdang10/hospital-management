/**
 * RemoveDiagnosisUseCase - Application Layer
 * Use case for removing diagnosis from medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export interface RemoveDiagnosisRequest {
    recordId: string;
    diagnosisCode: string;
    removedBy: string;
    reason?: string;
}
export interface RemoveDiagnosisResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        diagnosisCode: string;
        removedAt: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class RemoveDiagnosisUseCase extends BaseHealthcareUseCase<RemoveDiagnosisRequest, RemoveDiagnosisResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    execute(request: RemoveDiagnosisRequest): Promise<RemoveDiagnosisResponse>;
    protected executeInternal(request: RemoveDiagnosisRequest): Promise<RemoveDiagnosisResponse>;
    validate(request: RemoveDiagnosisRequest): Promise<ValidationResult>;
    authorize(request: RemoveDiagnosisRequest, userId: string): Promise<boolean>;
    involvesPHI(request: RemoveDiagnosisRequest): boolean;
    getPatientId(request: RemoveDiagnosisRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=RemoveDiagnosisUseCase.d.ts.map