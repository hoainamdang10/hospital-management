/**
 * UpdatePatientInfoUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Updates patient information with authorization and audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
export interface UpdatePatientInfoRequest {
    patientId: string;
    updates: {
        personalInfo?: {
            fullName?: string;
            nationality?: string;
            ethnicity?: string;
            occupation?: string;
            maritalStatus?: string;
        };
        contactInfo?: {
            phoneNumber?: string;
            email?: string;
            address?: {
                street?: string;
                ward?: string;
                district?: string;
                city?: string;
                province?: string;
                postalCode?: string;
                country?: string;
            };
        };
        medicalInfo?: {
            bloodType?: string;
            allergies?: string[];
            chronicConditions?: string[];
            currentMedications?: string[];
            emergencyMedicalInfo?: string;
        };
        insuranceInfo?: {
            provider?: string;
            policyNumber?: string;
            groupNumber?: string;
            validFrom?: string;
            validTo?: string;
            coverageType?: string;
            bhytNumber?: string;
        };
    };
    requestedBy: string;
    requestedByRole: string;
    updateReason?: string;
    requestMetadata?: {
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    };
}
export interface UpdatePatientInfoResponse {
    success: boolean;
    message: string;
    errors?: string[];
    data?: {
        patient: {
            id: string;
            updatedAt: string;
            updatedFields: string[];
        };
    };
}
/**
 * Update Patient Info Use Case
 * Handles patient information updates with proper authorization and validation
 */
export declare class UpdatePatientInfoUseCase extends BaseHealthcareUseCase<UpdatePatientInfoRequest, UpdatePatientInfoResponse> {
    private readonly patientRepository;
    private readonly eventBus;
    private readonly logger;
    constructor(patientRepository: IPatientRepository, eventBus: IEventBus, logger: ILogger);
    /**
     * Execute patient info update
     */
    protected executeImpl(request: UpdatePatientInfoRequest): Promise<UpdatePatientInfoResponse>;
    /**
     * Validate update request
     */
    private validateRequest;
    /**
     * Check authorization for patient update
     */
    private checkUpdateAuthorization;
    /**
     * Capture original data for audit trail
     */
    private captureOriginalData;
    /**
     * Apply updates to patient
     */
    private applyUpdates;
    /**
     * Publish domain events
     */
    private publishDomainEvents;
    /**
     * HIPAA audit logging for patient update
     */
    private auditPatientUpdate;
}
//# sourceMappingURL=UpdatePatientInfoUseCase.d.ts.map