/**
 * InsuranceValidationService - Application Layer
 * Validates Vietnamese health insurance numbers (BHYT, BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards
 */
import { ILogger } from '@shared/application/services/logger.interface';
import { IInsuranceValidationService, ValidationResult, ExpirationCheckResult, InsuranceValidationServiceStatus } from './IInsuranceValidationService';
/**
 * Insurance Validation Service Implementation
 * Validates BHYT and BHTN numbers according to Vietnamese standards
 */
export declare class InsuranceValidationService implements IInsuranceValidationService {
    private logger;
    private readonly BHYT_PROVINCE_CODES;
    private readonly BHYT_PRIORITY_LEVELS;
    private readonly BHYT_GROUP_CODES;
    constructor(logger: ILogger);
    /**
     * Validate BHYT number
     * Format: XX-Y-ZZ-YYYY-NNNNN-CCCCC
     * Example: HN-1-01-2024-12345-67890
     *
     * XX: Province code (2 letters)
     * Y: Priority level (1 digit)
     * ZZ: Group code (2 digits)
     * YYYY: Year (4 digits)
     * NNNNN: ID number (5 digits)
     * CCCCC: Check digit (5 digits)
     */
    validateBHYTNumber(bhytNumber: string): Promise<ValidationResult>;
    /**
     * Validate BHTN number
     * Format: BHTN-YYYY-NNNNNNNN
     * Example: BHTN-2024-12345678
     *
     * YYYY: Year (4 digits)
     * NNNNNNNN: Policy number (8 digits)
     */
    validateBHTNNumber(bhtnNumber: string): Promise<ValidationResult>;
    /**
     * Check if insurance is expired
     */
    checkExpiration(_validFrom: Date, validTo: Date): ExpirationCheckResult;
    /**
     * Validate complete insurance information
     */
    validateInsurance(insuranceType: string, policyNumber: string, validFrom: Date, validTo: Date): Promise<ValidationResult>;
    /**
     * Validate insurance dates
     */
    private validateInsuranceDates;
    /**
     * Get service status
     */
    getStatus(): InsuranceValidationServiceStatus;
}
//# sourceMappingURL=InsuranceValidationService.d.ts.map