/**
 * AddDiagnosisUseCase - Application Layer
 * Use case for adding diagnosis to medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { DiagnosisCategory, DiagnosisSeverity, DiagnosisStatus } from '../../domain/value-objects/Diagnosis';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export interface AddDiagnosisRequest {
    recordId: string;
    code: string;
    display: string;
    category: DiagnosisCategory;
    severity: DiagnosisSeverity;
    status: DiagnosisStatus;
    recordedBy: string;
}
export interface AddDiagnosisResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        diagnosisCode: string;
        addedAt: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class AddDiagnosisUseCase extends BaseHealthcareUseCase<AddDiagnosisRequest, AddDiagnosisResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    execute(request: AddDiagnosisRequest): Promise<AddDiagnosisResponse>;
    protected executeInternal(request: AddDiagnosisRequest): Promise<AddDiagnosisResponse>;
    validate(request: AddDiagnosisRequest): Promise<ValidationResult>;
    authorize(request: AddDiagnosisRequest, userId: string): Promise<boolean>;
    involvesPHI(request: AddDiagnosisRequest): boolean;
    getPatientId(request: AddDiagnosisRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=AddDiagnosisUseCase.d.ts.map