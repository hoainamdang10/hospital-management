/**
 * IInsuranceValidationService - Application Layer Interface
 * Defines contract for Vietnamese insurance validation (BHYT/BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

/**
 * Validation result
 */
export type InsuranceMetadata = Record<string, string | number | boolean | undefined>;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: InsuranceMetadata;
}

/**
 * Expiration check result
 */
export interface ExpirationCheckResult {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiration: number;
}

/**
 * Insurance Validation Service Interface
 * Validates Vietnamese health insurance (BHYT) and accident insurance (BHTN)
 */
export interface IInsuranceValidationService {
  /**
   * Validate BHYT (Bảo hiểm y tế) number
   * Format: XX-Y-ZZ-YYYY-NNNNN-CCCCC
   * @param bhytNumber - BHYT number to validate
   * @returns Validation result with errors and warnings
   */
  validateBHYTNumber(bhytNumber: string): Promise<ValidationResult>;

  /**
   * Validate BHTN (Bảo hiểm tai nạn) number
   * Format: BHTN-YYYY-NNNNNNNN
   * @param bhtnNumber - BHTN number to validate
   * @returns Validation result with errors and warnings
   */
  validateBHTNNumber(bhtnNumber: string): Promise<ValidationResult>;

  /**
   * Check if insurance is expired or expiring soon
   * @param validFrom - Insurance start date
   * @param validTo - Insurance end date
   * @returns Expiration status
   */
  checkExpiration(validFrom: Date, validTo: Date): ExpirationCheckResult;

  /**
   * Validate complete insurance information
   * @param insuranceType - Type of insurance (BHYT/BHTN/private)
   * @param policyNumber - Policy number
   * @param validFrom - Start date
   * @param validTo - End date
   * @returns Validation result
   */
  validateInsurance(
    insuranceType: string,
    policyNumber: string,
    validFrom: Date,
    validTo: Date
  ): Promise<ValidationResult>;

  /**
   * Get service health status
   * @returns Service status information
   */
  getStatus(): InsuranceValidationServiceStatus;
}

export interface InsuranceValidationServiceStatus {
  serviceName: string;
  supportedTypes: string[];
  provinceCodes: number;
  isHealthy: boolean;
  timestamp: string;
}
