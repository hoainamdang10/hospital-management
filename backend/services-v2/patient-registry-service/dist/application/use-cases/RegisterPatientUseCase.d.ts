/**
 * RegisterPatientUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Handles patient registration with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
export interface RegisterPatientRequest {
    userId: string;
    personalInfo: {
        fullName: string;
        dateOfBirth: string;
        gender: 'male' | 'female' | 'other';
        nationalId: string;
        nationality: string;
        ethnicity?: string;
        occupation?: string;
        maritalStatus?: string;
    };
    contactInfo: {
        phoneNumber: string;
        email?: string;
        address: {
            street: string;
            ward: string;
            district: string;
            city: string;
            province: string;
            postalCode?: string;
            country: string;
        };
    };
    medicalInfo: {
        bloodType?: string;
        allergies?: string[];
        chronicConditions?: string[];
        currentMedications?: string[];
        emergencyMedicalInfo?: string;
    };
    insuranceInfo?: {
        provider: string;
        policyNumber: string;
        groupNumber?: string;
        validFrom: string;
        validTo: string;
        coverageType: string;
        isVietnameseInsurance: boolean;
        bhytNumber?: string;
    };
    emergencyContacts: Array<{
        name: string;
        relationship: string;
        phoneNumber: string;
        email?: string;
        address?: string;
    }>;
    requestedBy: string;
    requestMetadata?: {
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    };
}
export interface RegisterPatientResponse {
    success: boolean;
    patientId?: string;
    message: string;
    errors?: string[];
    data?: {
        patient: {
            id: string;
            userId: string;
            fullName: string;
            registrationDate: string;
            isActive: boolean;
        };
    };
}
/**
 * Register Patient Use Case
 * Handles complete patient registration process with Vietnamese healthcare compliance
 */
export declare class RegisterPatientUseCase extends BaseHealthcareUseCase<RegisterPatientRequest, RegisterPatientResponse> {
    private readonly patientRepository;
    private readonly eventBus;
    private readonly logger;
    constructor(patientRepository: IPatientRepository, eventBus: IEventBus, logger: ILogger);
    /**
     * Execute patient registration
     */
    protected executeImpl(request: RegisterPatientRequest): Promise<RegisterPatientResponse>;
    /**
     * Validate registration request
     */
    private validateRequest;
    /**
     * Publish domain events
     */
    private publishDomainEvents;
    /**
     * HIPAA audit logging for patient registration
     */
    private auditPatientRegistration;
}
//# sourceMappingURL=RegisterPatientUseCase.d.ts.map