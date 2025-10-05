/**
 * ValidateInsuranceUseCase - Application Use Case
 *
 * Validates patient insurance (BHYT/BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
export interface ValidateInsuranceRequest {
    patientId: string;
    requestedBy: string;
}
export interface ValidateInsuranceResponse {
    success: boolean;
    message: string;
    errors?: string[];
    data?: {
        patientId: string;
        hasInsurance: boolean;
        insuranceInfo?: {
            provider: string;
            policyNumber: string;
            coverageType: string;
            isVietnameseInsurance: boolean;
            bhytNumber?: string;
            validFrom: string;
            validTo: string;
            isActive: boolean;
            isValid: boolean;
            daysUntilExpiration?: number;
        };
        validationResult: {
            isValid: boolean;
            reasons: string[];
        };
    };
}
export declare class ValidateInsuranceUseCase {
    private readonly patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(request: ValidateInsuranceRequest): Promise<ValidateInsuranceResponse>;
}
//# sourceMappingURL=ValidateInsuranceUseCase.d.ts.map