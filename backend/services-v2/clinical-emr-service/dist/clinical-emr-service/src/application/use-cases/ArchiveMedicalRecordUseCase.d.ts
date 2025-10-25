/**
 * ArchiveMedicalRecordUseCase - Application Layer
 * Use case for archiving medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export interface ArchiveMedicalRecordRequest {
    recordId: string;
    archivedBy: string;
    reason?: string;
}
export interface ArchiveMedicalRecordResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        archivedAt: string;
        archivedBy: string;
        reason?: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class ArchiveMedicalRecordUseCase extends BaseHealthcareUseCase<ArchiveMedicalRecordRequest, ArchiveMedicalRecordResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    execute(request: ArchiveMedicalRecordRequest): Promise<ArchiveMedicalRecordResponse>;
    protected executeInternal(request: ArchiveMedicalRecordRequest): Promise<ArchiveMedicalRecordResponse>;
    validate(request: ArchiveMedicalRecordRequest): Promise<ValidationResult>;
    authorize(request: ArchiveMedicalRecordRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ArchiveMedicalRecordRequest): boolean;
    getPatientId(request: ArchiveMedicalRecordRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=ArchiveMedicalRecordUseCase.d.ts.map