/**
 * AddDiagnosisCommandHandler - Application Layer
 * Command handler for adding diagnosis to medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../../domain/repositories/IMedicalRecordRepository';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
import { DiagnosisCategory, DiagnosisSeverity, DiagnosisStatus } from '../../../domain/value-objects/Diagnosis';
/**
 * Add Diagnosis Command
 */
export interface AddDiagnosisCommand {
    recordId: string;
    diagnosisCode: string;
    diagnosisDisplay: string;
    category: DiagnosisCategory;
    severity: DiagnosisSeverity;
    status: DiagnosisStatus;
    addedBy: string;
    description?: string;
    onsetDate?: string;
    vietnameseClassification?: string;
    specialtyCode?: string;
    notes?: string;
    confidence?: number;
}
/**
 * Add Diagnosis Response
 */
export interface AddDiagnosisResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        diagnosisCode: string;
        diagnosisDisplay: string;
        category: DiagnosisCategory;
        severity: DiagnosisSeverity;
        status: DiagnosisStatus;
        addedAt: string;
        addedBy: string;
        fhirCompliant: boolean;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
/**
 * Add Diagnosis Command Handler
 */
export declare class AddDiagnosisCommandHandler extends BaseHealthcareUseCase<AddDiagnosisCommand, AddDiagnosisResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    /**
     * Execute the command
     */
    protected executeInternal(command: AddDiagnosisCommand): Promise<AddDiagnosisResponse>;
    /**
     * Create diagnosis value object from command
     */
    private createDiagnosis;
    /**
     * Validate FHIR compliance
     */
    private validateFHIRCompliance;
    /**
     * Validate command
     */
    validate(command: AddDiagnosisCommand): Promise<ValidationResult>;
    /**
     * Check authorization
     */
    authorize(command: AddDiagnosisCommand, userId: string): Promise<boolean>;
    /**
     * Check if involves PHI
     */
    involvesPHI(command: AddDiagnosisCommand): boolean;
    /**
     * Get patient ID
     */
    getPatientId(command: AddDiagnosisCommand): string | null;
    /**
     * Get use case description
     */
    getDescription(): string;
    /**
     * Get required permissions
     */
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=AddDiagnosisCommandHandler.d.ts.map