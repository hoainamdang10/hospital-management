/**
 * RestoreMedicalRecordUseCase - Application Layer
 * Use case for restoring archived medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export interface RestoreMedicalRecordRequest {
    recordId: string;
    restoredBy: string;
    reason?: string;
}
export interface RestoreMedicalRecordResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        restoredAt: string;
        restoredBy: string;
        reason?: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class RestoreMedicalRecordUseCase extends BaseHealthcareUseCase<RestoreMedicalRecordRequest, RestoreMedicalRecordResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    execute(request: RestoreMedicalRecordRequest): Promise<RestoreMedicalRecordResponse>;
    protected executeInternal(request: RestoreMedicalRecordRequest): Promise<RestoreMedicalRecordResponse>;
    validate(request: RestoreMedicalRecordRequest): Promise<ValidationResult>;
    authorize(request: RestoreMedicalRecordRequest, userId: string): Promise<boolean>;
    involvesPHI(request: RestoreMedicalRecordRequest): boolean;
    getPatientId(request: RestoreMedicalRecordRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=RestoreMedicalRecordUseCase.d.ts.map