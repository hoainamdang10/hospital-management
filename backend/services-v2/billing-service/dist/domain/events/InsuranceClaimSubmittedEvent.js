"use strict";
/**
 * InsuranceClaimSubmittedEvent - Domain Event
 * Raised when an insurance claim is submitted
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsuranceClaimSubmittedEvent = void 0;
class InsuranceClaimSubmittedEvent {
    constructor(invoiceId, patientId, claimId, insuranceType, insuranceNumber, claimAmount, currency, claimNumber, occurredAt) {
        this.invoiceId = invoiceId;
        this.patientId = patientId;
        this.claimId = claimId;
        this.insuranceType = insuranceType;
        this.insuranceNumber = insuranceNumber;
        this.claimAmount = claimAmount;
        this.currency = currency;
        this.claimNumber = claimNumber;
        this.eventVersion = 1;
        this.eventId = `insurance-claim-submitted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.aggregateId = invoiceId;
        this.occurredAt = occurredAt;
    }
    /**
     * Get event name
     */
    getEventName() {
        return 'InsuranceClaimSubmittedEvent';
    }
    /**
     * Get aggregate type
     */
    getAggregateType() {
        return 'BillingAggregate';
    }
    /**
     * Get Vietnamese insurance type
     */
    getVietnameseInsuranceType() {
        switch (this.insuranceType) {
            case 'BHYT': return 'Bảo hiểm Y tế';
            case 'BHTN': return 'Bảo hiểm Tai nạn';
            case 'Private': return 'Bảo hiểm tư nhân';
            default: return 'Bảo hiểm khác';
        }
    }
    /**
     * Format claim amount for Vietnamese display
     */
    getVietnameseClaimAmountDisplay() {
        if (this.currency === 'VND') {
            return `${this.claimAmount.toLocaleString('vi-VN')} đ`;
        }
        return `${this.claimAmount.toLocaleString()} ${this.currency}`;
    }
    /**
     * Get claim priority based on insurance type
     */
    getClaimPriority() {
        switch (this.insuranceType) {
            case 'BHYT':
            case 'BHTN':
                return 'high'; // Government insurance has high priority
            case 'Private':
                return 'medium';
            default:
                return 'low';
        }
    }
    /**
     * Get Vietnamese claim priority
     */
    getVietnameseClaimPriority() {
        switch (this.getClaimPriority()) {
            case 'high': return 'Cao';
            case 'medium': return 'Trung bình';
            case 'low': return 'Thấp';
            default: return 'Không xác định';
        }
    }
    /**
     * Check if BHYT claim
     */
    isBHYTClaim() {
        return this.insuranceType === 'BHYT';
    }
    /**
     * Check if BHTN claim
     */
    isBHTNClaim() {
        return this.insuranceType === 'BHTN';
    }
    /**
     * Check if private insurance claim
     */
    isPrivateClaim() {
        return this.insuranceType === 'Private';
    }
    /**
     * Get expected processing time (in days)
     */
    getExpectedProcessingDays() {
        switch (this.insuranceType) {
            case 'BHYT': return 15; // BHYT usually takes 15 days
            case 'BHTN': return 30; // BHTN can take up to 30 days
            case 'Private': return 7; // Private insurance is usually faster
            default: return 14;
        }
    }
    /**
     * Get Vietnamese processing time display
     */
    getVietnameseProcessingTimeDisplay() {
        const days = this.getExpectedProcessingDays();
        return `${days} ngày làm việc`;
    }
    /**
     * Get required documents for claim
     */
    getRequiredDocuments() {
        const documents = [];
        if (this.isBHYTClaim()) {
            documents.push('Thẻ BHYT');
            documents.push('CMND/CCCD');
            documents.push('Hóa đơn viện phí');
            documents.push('Tóm tắt hồ sơ bệnh án');
        }
        if (this.isBHTNClaim()) {
            documents.push('Giấy chứng nhận BHTN');
            documents.push('Biên bản tai nạn');
            documents.push('Giấy ra viện');
            documents.push('Chi tiết chi phí điều trị');
        }
        if (this.isPrivateClaim()) {
            documents.push('Hợp đồng bảo hiểm');
            documents.push('Đơn yêu cầu bồi thường');
            documents.push('Hóa đơn chi phí y tế');
            documents.push('Báo cáo y tế');
        }
        return documents;
    }
    /**
     * Get event data
     */
    getEventData() {
        return {
            invoiceId: this.invoiceId,
            patientId: this.patientId,
            claimId: this.claimId,
            insuranceType: this.insuranceType,
            vietnameseInsuranceType: this.getVietnameseInsuranceType(),
            insuranceNumber: this.insuranceNumber,
            claimAmount: this.claimAmount,
            currency: this.currency,
            vietnameseClaimAmountDisplay: this.getVietnameseClaimAmountDisplay(),
            claimNumber: this.claimNumber,
            claimPriority: this.getClaimPriority(),
            vietnameseClaimPriority: this.getVietnameseClaimPriority(),
            expectedProcessingDays: this.getExpectedProcessingDays(),
            vietnameseProcessingTimeDisplay: this.getVietnameseProcessingTimeDisplay(),
            requiredDocuments: this.getRequiredDocuments(),
            occurredAt: this.occurredAt.toISOString(),
            eventVersion: this.eventVersion,
            vietnameseDescription: `Đã gửi yêu cầu bồi thường ${this.getVietnameseInsuranceType()} số ${this.claimNumber}`
        };
    }
    /**
     * Get claim tracking info
     */
    getClaimTrackingInfo() {
        const expectedCompletion = new Date(this.occurredAt);
        expectedCompletion.setDate(expectedCompletion.getDate() + this.getExpectedProcessingDays());
        return {
            claimNumber: this.claimNumber,
            insuranceType: this.getVietnameseInsuranceType(),
            submittedDate: this.occurredAt.toLocaleDateString('vi-VN'),
            expectedCompletionDate: expectedCompletion.toLocaleDateString('vi-VN'),
            status: 'Đã gửi'
        };
    }
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            eventId: this.eventId,
            eventName: this.getEventName(),
            aggregateId: this.aggregateId,
            aggregateType: this.getAggregateType(),
            eventVersion: this.eventVersion,
            occurredAt: this.occurredAt.toISOString(),
            eventData: this.getEventData(),
            claimTrackingInfo: this.getClaimTrackingInfo(),
            isBHYTClaim: this.isBHYTClaim(),
            isBHTNClaim: this.isBHTNClaim(),
            isPrivateClaim: this.isPrivateClaim()
        };
    }
}
exports.InsuranceClaimSubmittedEvent = InsuranceClaimSubmittedEvent;
//# sourceMappingURL=InsuranceClaimSubmittedEvent.js.map