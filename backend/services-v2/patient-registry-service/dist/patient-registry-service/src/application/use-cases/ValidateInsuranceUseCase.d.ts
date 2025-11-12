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
import { IInsuranceValidationService } from '../services/IInsuranceValidationService';
import { ILogger } from '@shared/application/services/logger.interface';
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
    private readonly insuranceValidationService;
    private readonly logger;
    constructor(patientRepository: IPatientRepository, insuranceValidationService: IInsuranceValidationService, logger: ILogger);
    execute(request: ValidateInsuranceRequest): Promise<ValidateInsuranceResponse>;
    /**
     * HIPAA audit logging for insurance validation
     */
    private auditInsuranceValidation;
}
//# sourceMappingURL=ValidateInsuranceUseCase.d.ts.map