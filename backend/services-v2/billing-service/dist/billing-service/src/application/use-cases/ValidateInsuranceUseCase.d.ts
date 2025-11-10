/**
 * ValidateInsuranceUseCase - Application Layer
 * Use case for validating insurance information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Vietnamese Insurance Standards
 */
import { InsuranceType, BHYTBeneficiaryType, BHTNAccidentType } from '../../domain/value-objects/Insurance';
export interface ValidateInsuranceRequest {
    type: InsuranceType;
    number: string;
    validUntil: Date;
    coverageLevel: number;
    issuedBy?: string;
    beneficiaryType?: BHYTBeneficiaryType;
    accidentType?: BHTNAccidentType;
    accidentDate?: Date;
    employerInfo?: string;
    insuranceCompany?: string;
    policyType?: string;
    patientId?: string;
    treatmentAmount?: number;
    treatmentCurrency?: string;
}
export interface ValidateInsuranceResponse {
    success: boolean;
    data?: {
        isValid: boolean;
        insurance: {
            type: string;
            number: string;
            vietnameseType: string;
            coverageLevel: number;
            coverageLevelDisplay: string;
            validityStatus: string;
            isExpired: boolean;
            isExpiringSoon: boolean;
            daysUntilExpiry: number;
            bhytRegionCode?: string;
            bhytRegionName?: string;
        };
        coverage?: {
            treatmentAmount: number;
            coverageAmount: number;
            patientPayment: number;
            currency: string;
            coveragePercentage: number;
            vietnameseCoverageDisplay: string;
            vietnamesePatientPaymentDisplay: string;
        };
        validation: {
            formatValid: boolean;
            expiryValid: boolean;
            coverageLevelValid: boolean;
            specificValidation: Record<string, boolean>;
        };
        requirements: {
            requiredDocuments: string[];
            requiresAdditionalDocumentation: boolean;
            processingTime: string;
            expectedProcessingDays: number;
        };
        warnings: string[];
        recommendations: string[];
        vietnameseSummary: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        severity: 'error' | 'warning' | 'info';
    }>;
    message: string;
}
/**
 * ValidateInsuranceUseCase
 * Handles insurance validation and coverage calculation
 */
export declare class ValidateInsuranceUseCase {
    /**
     * Execute use case
     */
    execute(request: ValidateInsuranceRequest): Promise<ValidateInsuranceResponse>;
    /**
     * Validate request
     */
    private validateRequest;
    /**
     * Create insurance object
     */
    private createInsurance;
    /**
     * Perform validation
     */
    private performValidation;
    /**
     * Validate format
     */
    private validateFormat;
    /**
     * Perform specific validation
     */
    private performSpecificValidation;
    /**
     * Calculate coverage
     */
    private calculateCoverage;
    /**
     * Generate warnings
     */
    private generateWarnings;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Get processing time
     */
    private getProcessingTime;
    /**
     * Get expected processing days
     */
    private getExpectedProcessingDays;
    /**
     * Generate Vietnamese summary
     */
    private generateVietnameseSummary;
}
//# sourceMappingURL=ValidateInsuranceUseCase.d.ts.map