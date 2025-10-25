/**
 * CreateMedicalRecordUseCase - Application Layer
 * Use case for creating new medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { CreateMedicalRecordRequest, CreateMedicalRecordResponse } from '../dto/CreateMedicalRecordRequest';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export declare class CreateMedicalRecordUseCase extends BaseHealthcareUseCase<CreateMedicalRecordRequest, CreateMedicalRecordResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    /**
     * Public execute method - required by BaseHealthcareUseCase
     */
    execute(request: CreateMedicalRecordRequest): Promise<CreateMedicalRecordResponse>;
    /**
     * Execute the use case
     */
    protected executeInternal(request: CreateMedicalRecordRequest): Promise<CreateMedicalRecordResponse>;
    /**
     * Validate request
     */
    validate(request: CreateMedicalRecordRequest): Promise<ValidationResult>;
    /**
     * Check authorization
     */
    authorize(request: CreateMedicalRecordRequest, userId: string): Promise<boolean>;
    /**
     * Check if involves PHI
     */
    involvesPHI(request: CreateMedicalRecordRequest): boolean;
    /**
     * Get patient ID
     */
    getPatientId(request: CreateMedicalRecordRequest): string | null;
    /**
     * Get use case description for audit
     */
    getDescription(): string;
    /**
     * Get required permissions
     */
    getRequiredPermissions(): string[];
    /**
     * Check if user has required permissions
     */
    private checkPermissions;
    /**
     * Validate business rules
     */
    private validateBusinessRules;
    /**
     * Enhanced validation with business rules
     */
    validateWithBusinessRules(request: CreateMedicalRecordRequest): Promise<ValidationResult>;
    /**
     * Get audit information for this use case execution
     */
    getAuditInfo(request: CreateMedicalRecordRequest): {
        action: string;
        resourceType: string;
        details: {
            patientId: string;
            doctorId: string;
            appointmentId: string | undefined;
            visitDate: string;
            hasSymptoms: boolean;
            hasDiagnosis: boolean;
            hasTreatment: boolean;
            hasVitalSigns: boolean;
            createdBy: string;
        };
        complianceLevel: string;
        vietnameseDescription: string;
        patientId?: string;
        userId: string;
        timestamp: Date;
        ipAddress?: string;
        userAgent?: string;
    };
}
//# sourceMappingURL=CreateMedicalRecordUseCase.d.ts.map