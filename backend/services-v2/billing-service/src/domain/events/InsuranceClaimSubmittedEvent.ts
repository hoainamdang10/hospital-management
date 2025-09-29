/**
 * InsuranceClaimSubmittedEvent - Domain Event
 * Raised when an insurance claim is submitted
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { IDomainEvent } from '../../../../shared/domain/events/IDomainEvent';

export class InsuranceClaimSubmittedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly occurredAt: Date;
  public readonly eventVersion: number = 1;

  constructor(
    public readonly invoiceId: string,
    public readonly patientId: string,
    public readonly claimId: string,
    public readonly insuranceType: string,
    public readonly insuranceNumber: string,
    public readonly claimAmount: number,
    public readonly currency: string,
    public readonly claimNumber: string,
    occurredAt: Date
  ) {
    this.eventId = `insurance-claim-submitted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.aggregateId = invoiceId;
    this.occurredAt = occurredAt;
  }

  /**
   * Get event name
   */
  getEventName(): string {
    return 'InsuranceClaimSubmittedEvent';
  }

  /**
   * Get aggregate type
   */
  getAggregateType(): string {
    return 'BillingAggregate';
  }

  /**
   * Get Vietnamese insurance type
   */
  getVietnameseInsuranceType(): string {
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
  getVietnameseClaimAmountDisplay(): string {
    if (this.currency === 'VND') {
      return `${this.claimAmount.toLocaleString('vi-VN')} đ`;
    }
    return `${this.claimAmount.toLocaleString()} ${this.currency}`;
  }

  /**
   * Get claim priority based on insurance type
   */
  getClaimPriority(): 'high' | 'medium' | 'low' {
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
  getVietnameseClaimPriority(): string {
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
  isBHYTClaim(): boolean {
    return this.insuranceType === 'BHYT';
  }

  /**
   * Check if BHTN claim
   */
  isBHTNClaim(): boolean {
    return this.insuranceType === 'BHTN';
  }

  /**
   * Check if private insurance claim
   */
  isPrivateClaim(): boolean {
    return this.insuranceType === 'Private';
  }

  /**
   * Get expected processing time (in days)
   */
  getExpectedProcessingDays(): number {
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
  getVietnameseProcessingTimeDisplay(): string {
    const days = this.getExpectedProcessingDays();
    return `${days} ngày làm việc`;
  }

  /**
   * Get required documents for claim
   */
  getRequiredDocuments(): string[] {
    const documents: string[] = [];

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
  getEventData(): any {
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
  getClaimTrackingInfo(): {
    claimNumber: string;
    insuranceType: string;
    submittedDate: string;
    expectedCompletionDate: string;
    status: string;
  } {
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
  toJSON(): any {
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
