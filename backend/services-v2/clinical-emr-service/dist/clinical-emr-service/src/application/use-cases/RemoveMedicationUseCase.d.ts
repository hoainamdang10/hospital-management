/**
 * RemoveMedicationUseCase - Application Layer
 * Use case for removing medication from medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export interface RemoveMedicationRequest {
    recordId: string;
    medicationCode: string;
    removedBy: string;
    reason?: string;
}
export interface RemoveMedicationResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        medicationCode: string;
        removedAt: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class RemoveMedicationUseCase extends BaseHealthcareUseCase<RemoveMedicationRequest, RemoveMedicationResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    execute(request: RemoveMedicationRequest): Promise<RemoveMedicationResponse>;
    protected executeInternal(request: RemoveMedicationRequest): Promise<RemoveMedicationResponse>;
    validate(request: RemoveMedicationRequest): Promise<ValidationResult>;
    authorize(request: RemoveMedicationRequest, userId: string): Promise<boolean>;
    involvesPHI(request: RemoveMedicationRequest): boolean;
    getPatientId(request: RemoveMedicationRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=RemoveMedicationUseCase.d.ts.map