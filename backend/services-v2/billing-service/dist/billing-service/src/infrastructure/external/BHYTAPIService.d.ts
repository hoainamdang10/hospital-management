/**
 * BHYTAPIService - Infrastructure Layer
 * Service for integrating with BHYT (Vietnamese Social Health Insurance) API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards, BHYT Integration
 */
export interface BHYTConfig {
    apiUrl: string;
    username: string;
    password: string;
    hospitalCode: string;
    departmentCode: string;
    environment: 'test' | 'production';
    timeout: number;
}
export interface BHYTCardInfo {
    cardNumber: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    validFrom: string;
    validTo: string;
    beneficiaryType: string;
    regionCode: string;
    regionName: string;
    issuedBy: string;
    coverageLevel: number;
    isActive: boolean;
    remainingBenefit: number;
    usedBenefit: number;
}
export interface BHYTValidationRequest {
    cardNumber: string;
    patientName: string;
    dateOfBirth: string;
    treatmentDate: string;
}
export interface BHYTValidationResponse {
    success: boolean;
    data?: {
        isValid: boolean;
        cardInfo: BHYTCardInfo;
        coverageInfo: {
            coverageLevel: number;
            copaymentRate: number;
            maxBenefit: number;
            remainingBenefit: number;
            benefitPeriod: string;
        };
        warnings: string[];
        restrictions: string[];
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface BHYTClaimRequest {
    cardNumber: string;
    patientInfo: {
        fullName: string;
        dateOfBirth: string;
        gender: string;
        address: string;
    };
    treatmentInfo: {
        admissionDate: string;
        dischargeDate: string;
        diagnosis: string;
        icdCode: string;
        treatmentResult: string;
    };
    serviceDetails: Array<{
        serviceCode: string;
        serviceName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        isCovered: boolean;
    }>;
    totalAmount: number;
    claimAmount: number;
    hospitalInfo: {
        code: string;
        name: string;
        level: string;
    };
    doctorInfo: {
        code: string;
        name: string;
        specialization: string;
    };
}
export interface BHYTClaimResponse {
    success: boolean;
    data?: {
        claimId: string;
        claimNumber: string;
        status: 'submitted' | 'processing' | 'approved' | 'rejected';
        submittedAt: string;
        expectedProcessingDays: number;
        approvedAmount?: number;
        rejectionReason?: string;
        nextSteps: string[];
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
/**
 * BHYTAPIService
 * Handles integration with Vietnamese BHYT system
 */
export declare class BHYTAPIService {
    private readonly config;
    private authToken?;
    private tokenExpiry?;
    constructor(config: BHYTConfig);
    /**
     * Validate BHYT card
     */
    validateCard(request: BHYTValidationRequest): Promise<BHYTValidationResponse>;
    /**
     * Submit insurance claim
     */
    submitClaim(request: BHYTClaimRequest): Promise<BHYTClaimResponse>;
    /**
     * Get claim status
     */
    getClaimStatus(claimId: string): Promise<{
        success: boolean;
        data?: {
            claimId: string;
            claimNumber: string;
            status: string;
            submittedAt: string;
            processedAt?: string;
            approvedAmount?: number;
            rejectionReason?: string;
            processingHistory: Array<{
                status: string;
                timestamp: string;
                note?: string;
            }>;
        };
        error?: {
            code: string;
            message: string;
        };
    }>;
    /**
     * Get service coverage information
     */
    getServiceCoverage(serviceCode: string, cardNumber: string): Promise<{
        success: boolean;
        data?: {
            serviceCode: string;
            serviceName: string;
            isCovered: boolean;
            coverageLevel: number;
            maxAmount?: number;
            copaymentRate: number;
            restrictions: string[];
        };
        error?: {
            code: string;
            message: string;
        };
    }>;
    /**
     * Authenticate with BHYT system
     */
    private authenticate;
    /**
     * Ensure authentication token is valid
     */
    private ensureAuthenticated;
    /**
     * Call BHYT API with authentication
     */
    private callBHYTAPI;
    /**
     * Validate card validation request
     */
    private validateRequest;
    /**
     * Validate claim request
     */
    private validateClaimRequest;
    /**
     * Map BHYT API response to card info
     */
    private mapCardInfo;
    /**
     * Calculate coverage information
     */
    private calculateCoverage;
    /**
     * Generate warnings for card
     */
    private generateWarnings;
    /**
     * Generate restrictions for card
     */
    private generateRestrictions;
    /**
     * Generate next steps for claim
     */
    private generateNextSteps;
}
//# sourceMappingURL=BHYTAPIService.d.ts.map