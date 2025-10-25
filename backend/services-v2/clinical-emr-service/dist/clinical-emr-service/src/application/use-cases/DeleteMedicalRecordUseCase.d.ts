/**
 * DeleteMedicalRecordUseCase - Application Layer
 * Use case for soft-deleting medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export interface DeleteMedicalRecordRequest {
    recordId: string;
    deletedBy: string;
    reason: string;
}
export interface DeleteMedicalRecordResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        deletedAt: string;
        deletedBy: string;
        reason: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class DeleteMedicalRecordUseCase extends BaseHealthcareUseCase<DeleteMedicalRecordRequest, DeleteMedicalRecordResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    execute(request: DeleteMedicalRecordRequest): Promise<DeleteMedicalRecordResponse>;
    protected executeInternal(request: DeleteMedicalRecordRequest): Promise<DeleteMedicalRecordResponse>;
    validate(request: DeleteMedicalRecordRequest): Promise<ValidationResult>;
    authorize(request: DeleteMedicalRecordRequest, userId: string): Promise<boolean>;
    involvesPHI(request: DeleteMedicalRecordRequest): boolean;
    getPatientId(request: DeleteMedicalRecordRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=DeleteMedicalRecordUseCase.d.ts.map