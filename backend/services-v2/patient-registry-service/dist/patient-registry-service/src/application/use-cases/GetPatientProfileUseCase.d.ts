/**
 * GetPatientProfileUseCase - Application Use Case
 *
 * Retrieves patient profile information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '../../../../shared/application/services/logger.interface';
import { AuditService } from '../../infrastructure/audit/AuditService';
export interface GetPatientProfileRequest {
    patientId?: string;
    userId?: string;
    nationalId?: string;
    bhytNumber?: string;
    requestedBy: string;
}
export interface GetPatientProfileResponse {
    success: boolean;
    message: string;
    errors?: string[];
    data?: {
        patientId: string;
        userId: string;
        personalInfo: {
            fullName: string;
            dateOfBirth: string;
            gender: string;
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
            preferredContactMethod: string;
            address: {
                street: string;
                ward: string;
                district: string;
                city: string;
                postalCode?: string;
                country: string;
            };
        };
        basicMedicalInfo: {
            bloodType?: string;
            knownAllergies: string[];
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
            isPrimary: boolean;
            isActive: boolean;
        };
        emergencyContacts: Array<{
            id: string;
            name: string;
            relationship: string;
            primaryPhone: string;
            secondaryPhone?: string;
            email?: string;
            address?: string;
            isPrimary: boolean;
        }>;
        status: string;
        createdAt: string;
        updatedAt: string;
    };
}
export declare class GetPatientProfileUseCase {
    private readonly patientRepository;
    private readonly logger;
    private readonly auditService;
    constructor(patientRepository: IPatientRepository, logger: ILogger, auditService: AuditService);
    execute(request: GetPatientProfileRequest): Promise<GetPatientProfileResponse>;
    /**
     * HIPAA audit logging for patient profile access
     * Logs PHI access to phi_access_logs table via AuditService
     */
    private auditPatientProfileAccess;
}
//# sourceMappingURL=GetPatientProfileUseCase.d.ts.map