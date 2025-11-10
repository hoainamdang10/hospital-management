/**
 * InsuranceClaimSubmittedEvent - Domain Event
 * Raised when an insurance claim is submitted
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export declare class InsuranceClaimSubmittedEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly patientId: string;
    readonly claimId: string;
    readonly insuranceType: string;
    readonly insuranceNumber: string;
    readonly claimAmount: number;
    readonly currency: string;
    readonly claimNumber: string;
    constructor(invoiceId: string, patientId: string, claimId: string, insuranceType: string, insuranceNumber: string, claimAmount: number, currency: string, claimNumber: string);
    /**
     * Get aggregate type
     */
    getAggregateType(): string;
    /**
     * Get Vietnamese insurance type
     */
    getVietnameseInsuranceType(): string;
    /**
     * Format claim amount for Vietnamese display
     */
    getVietnameseClaimAmountDisplay(): string;
    /**
     * Get claim priority based on insurance type
     */
    getClaimPriority(): 'high' | 'medium' | 'low';
    /**
     * Get Vietnamese claim priority
     */
    getVietnameseClaimPriority(): string;
    /**
     * Check if BHYT claim
     */
    isBHYTClaim(): boolean;
    /**
     * Check if BHTN claim
     */
    isBHTNClaim(): boolean;
    /**
     * Check if private insurance claim
     */
    isPrivateClaim(): boolean;
    /**
     * Get expected processing time (in days)
     */
    getExpectedProcessingDays(): number;
    /**
     * Get Vietnamese processing time display
     */
    getVietnameseProcessingTimeDisplay(): string;
    /**
     * Get required documents for claim
     */
    getRequiredDocuments(): string[];
    /**
     * Get event data
     */
    getEventData(): any;
    /**
     * Get claim tracking info
     */
    getClaimTrackingInfo(): {
        claimNumber: string;
        insuranceType: string;
        submittedDate: string;
        expectedCompletionDate: string;
        status: string;
    };
}
//# sourceMappingURL=InsuranceClaimSubmittedEvent.d.ts.map