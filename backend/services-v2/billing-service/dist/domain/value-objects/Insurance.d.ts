/**
 * Insurance Value Object - Domain Layer
 * Represents Vietnamese insurance information (BHYT/BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Insurance Standards
 */
import { ValueObject } from "../../../../shared/domain/ValueObject";
import { Money } from "./Money";
export declare enum InsuranceType {
    BHYT = "BHYT",// Bảo hiểm Y tế
    BHTN = "BHTN",// Bảo hiểm Tai nạn
    PRIVATE = "Private",// Bảo hiểm tư nhân
    SELF_PAY = "Self-pay"
}
export declare enum BHYTBeneficiaryType {
    EMPLOYEE = "Ng\u01B0\u1EDDi lao \u0111\u1ED9ng",
    RETIREE = "Ng\u01B0\u1EDDi v\u1EC1 h\u01B0u",
    STUDENT = "H\u1ECDc sinh, sinh vi\u00EAn",
    CHILD = "Tr\u1EBB em d\u01B0\u1EDBi 6 tu\u1ED5i",
    ELDERLY = "Ng\u01B0\u1EDDi cao tu\u1ED5i",
    POOR = "H\u1ED9 ngh\u00E8o",
    ETHNIC_MINORITY = "D\u00E2n t\u1ED9c thi\u1EC3u s\u1ED1",
    DISABLED = "Ng\u01B0\u1EDDi khuy\u1EBFt t\u1EADt",
    OTHER = "Kh\u00E1c"
}
export declare enum BHTNAccidentType {
    WORK_ACCIDENT = "Tai n\u1EA1n lao \u0111\u1ED9ng",
    TRAFFIC_ACCIDENT = "Tai n\u1EA1n giao th\u00F4ng",
    OCCUPATIONAL_DISEASE = "B\u1EC7nh ngh\u1EC1 nghi\u1EC7p",
    OTHER_ACCIDENT = "Tai n\u1EA1n kh\u00E1c"
}
interface InsuranceProps {
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
    additionalInfo?: Record<string, any>;
}
/**
 * Insurance Value Object
 * Handles Vietnamese insurance types with proper validation
 */
export declare class Insurance extends ValueObject<InsuranceProps> {
    private constructor();
    /**
     * Create BHYT insurance
     */
    static createBHYT(number: string, validUntil: Date, coverageLevel: number, beneficiaryType: BHYTBeneficiaryType, issuedBy: string): Insurance;
    /**
     * Create BHTN insurance
     */
    static createBHTN(number: string, validUntil: Date, accidentType: BHTNAccidentType, accidentDate: Date, employerInfo?: string): Insurance;
    /**
     * Create private insurance
     */
    static createPrivate(number: string, validUntil: Date, coverageLevel: number, insuranceCompany: string, policyType: string): Insurance;
    /**
     * Create self-pay (no insurance)
     */
    static createSelfPay(): Insurance;
    /**
     * Get insurance type
     */
    get type(): InsuranceType;
    /**
     * Get insurance number
     */
    get number(): string;
    /**
     * Get valid until date
     */
    get validUntil(): Date;
    /**
     * Get coverage level (percentage)
     */
    get coverageLevel(): number;
    /**
     * Get issued by
     */
    get issuedBy(): string | undefined;
    /**
     * Get beneficiary type (for BHYT)
     */
    get beneficiaryType(): BHYTBeneficiaryType | undefined;
    /**
     * Get accident type (for BHTN)
     */
    get accidentType(): BHTNAccidentType | undefined;
    /**
     * Get accident date (for BHTN)
     */
    get accidentDate(): Date | undefined;
    /**
     * Check if insurance is valid (not expired)
     */
    isValid(): boolean;
    /**
     * Check if insurance is expired
     */
    isExpired(): boolean;
    /**
     * Get days until expiry
     */
    getDaysUntilExpiry(): number;
    /**
     * Check if expiring soon (within 30 days)
     */
    isExpiringSoon(): boolean;
    /**
     * Check if BHYT
     */
    isBHYT(): boolean;
    /**
     * Check if BHTN
     */
    isBHTN(): boolean;
    /**
     * Check if private insurance
     */
    isPrivate(): boolean;
    /**
     * Check if self-pay
     */
    isSelfPay(): boolean;
    /**
     * Calculate coverage amount
     */
    calculateCoverage(totalAmount: Money): Money;
    /**
     * Calculate patient payment (co-payment)
     */
    calculatePatientPayment(totalAmount: Money): Money;
    /**
     * Get Vietnamese insurance type display
     */
    getVietnameseTypeDisplay(): string;
    /**
     * Get coverage level display
     */
    getCoverageLevelDisplay(): string;
    /**
     * Get validity status display
     */
    getValidityStatusDisplay(): string;
    /**
     * Get BHYT region code
     */
    getBHYTRegionCode(): string | null;
    /**
     * Get BHYT region name
     */
    getBHYTRegionName(): string | null;
    /**
     * Check if requires additional documentation
     */
    requiresAdditionalDocumentation(): boolean;
    /**
     * Get required documents
     */
    getRequiredDocuments(): string[];
    /**
     * Validate BHYT number format
     */
    private static isValidBHYTNumber;
    /**
     * Validate BHTN number format
     */
    private static isValidBHTNNumber;
    /**
     * Get insurance summary for billing
     */
    getBillingSummary(totalAmount: Money): {
        insuranceType: string;
        insuranceNumber: string;
        coverageLevel: string;
        coverageAmount: Money;
        patientPayment: Money;
        validityStatus: string;
        requiresVerification: boolean;
    };
    /**
     * Convert to JSON
     */
    toJSON(): any;
    /**
     * String representation
     */
    toString(): string;
}
export {};
//# sourceMappingURL=Insurance.d.ts.map