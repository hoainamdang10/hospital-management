/**
 * UpdatePatientInfoUseCase - Application Use Case
 *
 * Handles patient information updates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { BloodType } from '../../domain/value-objects/BasicMedicalInfo';
import { IEventBus } from '../../../../shared/infrastructure/event-bus/EventBus';
import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface UpdatePatientInfoRequest {
    patientId: string;
    personalInfo?: {
        fullName: string;
        dateOfBirth: string;
        gender: 'male' | 'female' | 'other';
        nationalId: string;
        nationality: string;
        ethnicity?: string;
        occupation?: string;
        maritalStatus?: string;
    };
    contactInfo?: {
        primaryPhone: string;
        secondaryPhone?: string;
        email?: string;
        preferredContactMethod: 'phone' | 'email' | 'sms';
        address: {
            street: string;
            ward: string;
            district: string;
            city: string;
            postalCode?: string;
            country: string;
        };
    };
    basicMedicalInfo?: {
        bloodType?: BloodType;
        knownAllergies?: string[];
        emergencyMedicalInfo?: string;
    };
    insuranceInfo?: {
        provider: string;
        policyNumber: string;
        groupNumber?: string;
        validFrom: string;
        validTo: string;
        coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
        isVietnameseInsurance: boolean;
        bhytNumber?: string;
        isPrimary: boolean;
    };
    updatedBy: string;
}
export interface UpdatePatientInfoResponse {
    success: boolean;
    message: string;
    errors?: string[];
}
export declare class UpdatePatientInfoUseCase {
    private readonly patientRepository;
    private readonly eventBus;
    private readonly logger;
    constructor(patientRepository: IPatientRepository, eventBus: IEventBus, logger: ILogger);
    execute(request: UpdatePatientInfoRequest): Promise<UpdatePatientInfoResponse>;
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