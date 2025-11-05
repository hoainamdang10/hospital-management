/**
 * BHTNAPIService - Infrastructure Layer
 * Service for integrating with BHTN (Vietnamese Work Accident Insurance) API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards, BHTN Integration
 */
export interface BHTNConfig {
    apiUrl: string;
    username: string;
    password: string;
    hospitalCode: string;
    environment: 'test' | 'production';
    timeout: number;
}
export interface BHTNAccidentInfo {
    accidentId: string;
    accidentDate: string;
    accidentType: 'work_accident' | 'traffic_accident' | 'occupational_disease' | 'other';
    accidentLocation: string;
    accidentDescription: string;
    employerInfo: {
        companyName: string;
        companyCode: string;
        contactPerson: string;
        contactPhone: string;
    };
    victimInfo: {
        fullName: string;
        dateOfBirth: string;
        idNumber: string;
        position: string;
        workingYears: number;
    };
    insuranceInfo: {
        policyNumber: string;
        validFrom: string;
        validTo: string;
        coverageAmount: number;
    };
    status: 'reported' | 'investigating' | 'approved' | 'rejected' | 'closed';
}
export interface BHTNValidationRequest {
    policyNumber: string;
    victimName: string;
    dateOfBirth: string;
    accidentDate: string;
    accidentType: string;
    employerCode?: string;
}
export interface BHTNValidationResponse {
    success: boolean;
    data?: {
        isValid: boolean;
        accidentInfo: BHTNAccidentInfo;
        coverageInfo: {
            maxCoverage: number;
            usedAmount: number;
            remainingAmount: number;
            coverageTypes: string[];
        };
        approvalStatus: {
            isApproved: boolean;
            approvalDate?: string;
            approvalNumber?: string;
            restrictions: string[];
        };
        warnings: string[];
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface BHTNClaimRequest {
    policyNumber: string;
    accidentId: string;
    patientInfo: {
        fullName: string;
        dateOfBirth: string;
        idNumber: string;
        address: string;
        phone: string;
    };
    accidentDetails: {
        accidentDate: string;
        accidentType: string;
        accidentLocation: string;
        accidentDescription: string;
        policeReportNumber?: string;
        witnessInfo?: string;
    };
    treatmentInfo: {
        admissionDate: string;
        dischargeDate?: string;
        diagnosis: string;
        treatmentType: 'outpatient' | 'inpatient' | 'emergency';
        treatmentResult: string;
        disability?: {
            level: number;
            description: string;
            permanentDisability: boolean;
        };
    };
    medicalExpenses: Array<{
        category: 'medical_treatment' | 'rehabilitation' | 'prosthetics' | 'transportation' | 'other';
        description: string;
        amount: number;
        receiptNumber: string;
        date: string;
    }>;
    totalClaimAmount: number;
    supportingDocuments: string[];
}
export interface BHTNClaimResponse {
    success: boolean;
    data?: {
        claimId: string;
        claimNumber: string;
        status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_additional_info';
        submittedAt: string;
        expectedProcessingDays: number;
        approvedAmount?: number;
        rejectionReason?: string;
        additionalInfoRequired?: string[];
        nextReviewDate?: string;
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
/**
 * BHTNAPIService
 * Handles integration with Vietnamese BHTN system
 */
export declare class BHTNAPIService {
    private readonly config;
    private authToken?;
    private tokenExpiry?;
    constructor(config: BHTNConfig);
    /**
     * Validate BHTN policy and accident
     */
    validatePolicy(request: BHTNValidationRequest): Promise<BHTNValidationResponse>;
    /**
     * Submit BHTN claim
     */
    submitClaim(request: BHTNClaimRequest): Promise<BHTNClaimResponse>;
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
            lastUpdated: string;
            approvedAmount?: number;
            paidAmount?: number;
            rejectionReason?: string;
            investigationNotes?: string;
            processingHistory: Array<{
                status: string;
                timestamp: string;
                note?: string;
                officer?: string;
            }>;
            nextSteps: string[];
        };
        error?: {
            code: string;
            message: string;
        };
    }>;
    /**
     * Get accident report
     */
    getAccidentReport(accidentId: string): Promise<{
        success: boolean;
        data?: BHTNAccidentInfo;
        error?: {
            code: string;
            message: string;
        };
    }>;
    /**
     * Authenticate with BHTN system
     */
    private authenticate;
    /**
     * Ensure authentication token is valid
     */
    private ensureAuthenticated;
    /**
     * Call BHTN API with authentication
     */
    private callBHTNAPI;
    /**
     * Validate policy validation request
     */
    private validateRequest;
    /**
     * Validate claim request
     */
    private validateClaimRequest;
    /**
     * Map BHTN API response to accident info
     */
    private mapAccidentInfo;
    /**
     * Calculate coverage information
     */
    private calculateCoverage;
    /**
     * Check approval status
     */
    private checkApprovalStatus;
    /**
     * Generate warnings
     */
    private generateWarnings;
    /**
     * Get coverage types based on accident type
     */
    private getCoverageTypes;
    /**
     * Determine claim type
     */
    private determineClaimType;
    /**
     * Generate next steps based on status
     */
    private generateNextSteps;
}
//# sourceMappingURL=BHTNAPIService.d.ts.map