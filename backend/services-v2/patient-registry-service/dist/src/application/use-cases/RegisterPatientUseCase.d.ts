/**
 * RegisterPatientUseCase - Application Use Case
 *
 * Handles patient registration with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { BloodType } from '../../domain/value-objects/BasicMedicalInfo';
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
    emergencyContacts: Array<{
        name: string;
        relationship: string;
        primaryPhone: string;
        secondaryPhone?: string;
        email?: string;
        address?: string;
        isPrimary: boolean;
    }>;
    requestedBy: string;
}
export interface RegisterPatientResponse {
    success: boolean;
    patientId?: string;
    message: string;
    errors?: string[];
}
export declare class RegisterPatientUseCase {
    private readonly patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(request: RegisterPatientRequest): Promise<RegisterPatientResponse>;
}
//# sourceMappingURL=RegisterPatientUseCase.d.ts.map