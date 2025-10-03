/**
 * GetPatientProfileUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Retrieves patient profile with authorization and HIPAA compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
export interface GetPatientProfileRequest {
    patientId?: string;
    userId?: string;
    requestedBy: string;
    requestedByRole: string;
    includeFullMedicalHistory?: boolean;
    includeSensitiveInfo?: boolean;
    requestMetadata?: {
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    };
}
export interface GetPatientProfileResponse {
    success: boolean;
    message: string;
    errors?: string[];
    data?: {
        patient: {
            id: string;
            userId: string;
            personalInfo: {
                fullName: string;
                dateOfBirth: string;
                age: number;
                gender: string;
                nationalId?: string;
                nationality: string;
                ethnicity?: string;
                occupation?: string;
                maritalStatus?: string;
            };
            contactInfo: {
                phoneNumber?: string;
                email?: string;
                address: {
                    street?: string;
                    ward?: string;
                    district?: string;
                    city: string;
                    province: string;
                    country: string;
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
                provider: string;
                policyNumber?: string;
                coverageType: string;
                isActive: boolean;
                isVietnameseInsurance: boolean;
                bhytNumber?: string;
            };
            emergencyContacts?: Array<{
                name: string;
                relationship: string;
                phoneNumber?: string;
                email?: string;
            }>;
            registrationInfo: {
                registrationDate: string;
                lastVisitDate?: string;
                isActive: boolean;
            };
            statistics?: {
                totalVisits: number;
                activeConsents: number;
                medicalHistoryCount: number;
            };
        };
    };
}
/**
 * Get Patient Profile Use Case
 * Retrieves patient profile with proper authorization and data masking
 */
export declare class GetPatientProfileUseCase extends BaseHealthcareUseCase<GetPatientProfileRequest, GetPatientProfileResponse> {
    private readonly patientRepository;
    private readonly logger;
    constructor(patientRepository: IPatientRepository, logger: ILogger);
    /**
     * Execute get patient profile
     */
    protected executeImpl(request: GetPatientProfileRequest): Promise<GetPatientProfileResponse>;
    /**
     * Validate request
     */
    private validateRequest;
    /**
     * Check authorization for patient data access
     */
    private checkAuthorization;
    /**
     * Prepare patient data with appropriate masking based on access level
     */
    private preparePatientData;
    /**
     * Mask sensitive string data
     */
    private maskString;
    /**
     * Mask phone number
     */
    private maskPhoneNumber;
    /**
     * Mask email address
     */
    private maskEmail;
    /**
     * HIPAA audit logging for patient access
     */
    private auditPatientAccess;
    /**
     * Get list of data accessed for audit
     */
    private getDataAccessedList;
}
//# sourceMappingURL=GetPatientProfileUseCase.d.ts.map