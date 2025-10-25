/**
 * UpdateMedicalRecordUseCase - Application Layer
 * Use case for updating existing medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { UpdateMedicalRecordRequest, UpdateMedicalRecordResponse } from '../dto/UpdateMedicalRecordRequest';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export declare class UpdateMedicalRecordUseCase extends BaseHealthcareUseCase<UpdateMedicalRecordRequest, UpdateMedicalRecordResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    /**
     * Public execute method - required by BaseHealthcareUseCase
     */
    execute(request: UpdateMedicalRecordRequest): Promise<UpdateMedicalRecordResponse>;
    /**
     * Execute the use case
     */
    protected executeInternal(request: UpdateMedicalRecordRequest): Promise<UpdateMedicalRecordResponse>;
    /**
     * Validate request
     */
    validate(request: UpdateMedicalRecordRequest): Promise<ValidationResult>;
    /**
     * Check authorization
     */
    authorize(request: UpdateMedicalRecordRequest, userId: string): Promise<boolean>;
    /**
     * Check if involves PHI
     */
    involvesPHI(request: UpdateMedicalRecordRequest): boolean;
    /**
     * Get patient ID
     */
    getPatientId(request: UpdateMedicalRecordRequest): string | null;
    /**
     * Get patient ID from medical record (helper method)
     */
    private getPatientIdFromRecord;
    /**
     * Validate business rules
     */
    private validateBusinessRules;
    /**
     * Get use case description for audit
     */
    getDescription(): string;
    /**
     * Get required permissions
     */
    getRequiredPermissions(): string[];
    /**
     * Enhanced authorization with role-based access control
     */
    authorizeWithRoles(request: UpdateMedicalRecordRequest, userId: string, userRoles: string[]): Promise<boolean>;
    /**
     * Get audit information for this use case execution
     */
    getAuditInfoAsync(request: UpdateMedicalRecordRequest): Promise<{
        action: string;
        resourceType: string;
        resourceId: string;
        patientId: string | null;
        details: {
            recordId: string;
            updatedFields: string[];
            hasVitalSignsUpdate: boolean;
            updatedBy: string;
            updateReason: string | undefined;
        };
        complianceLevel: string;
        vietnameseDescription: string;
        userId: string;
        timestamp: Date;
        ipAddress?: string;
        userAgent?: string;
    }>;
    /**
     * Enhanced execute with role-based access control
     */
    executeWithRoles(request: UpdateMedicalRecordRequest, userId: string, userRoles: string[]): Promise<UpdateMedicalRecordResponse>;
}
//# sourceMappingURL=UpdateMedicalRecordUseCase.d.ts.map