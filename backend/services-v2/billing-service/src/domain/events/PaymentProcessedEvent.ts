/**
 * PaymentProcessedEvent - Domain Event
 * Raised when a payment is processed for an invoice
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '../../../../shared/domain/base/domain-event';

export class PaymentProcessedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly patientId: string,
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly paymentMethod: string,
    public readonly transactionId: string | undefined,
    public readonly processedBy: string
  ) {
    super(invoiceId, 'PaymentProcessedEvent', 1);
  }

  /**
   * Get aggregate type
   */
  getAggregateType(): string {
    return 'BillingAggregate';
  }

  /**
   * Get Vietnamese payment method
   */
  getVietnamesePaymentMethod(): string {
    switch (this.paymentMethod) {
      case 'cash': return 'Tiền mặt';
      case 'card': return 'Thẻ';
      case 'bank_transfer': return 'Chuyển khoản';
      case 'payos': return 'PayOS';
      case 'insurance_direct': return 'Bảo hiểm trực tiếp';
      default: return 'Khác';
    }
  }

  /**
   * Format amount for Vietnamese display
   */
  getVietnameseAmountDisplay(): string {
    if (this.currency === 'VND') {
      return `${this.amount.toLocaleString('vi-VN')} đ`;
    }
    return `${this.amount.toLocaleString()} ${this.currency}`;
  }

  /**
   * Get event data
   */
  getEventData(): any {
    return {
      invoiceId: this.invoiceId,
      patientId: this.patientId,
      paymentId: this.paymentId,
      amount: this.amount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      vietnamesePaymentMethod: this.getVietnamesePaymentMethod(),
      vietnameseAmountDisplay: this.getVietnameseAmountDisplay(),
      transactionId: this.transactionId,
      processedBy: this.processedBy,
      vietnameseDescription: `Thanh toán ${this.getVietnameseAmountDisplay()} bằng ${this.getVietnamesePaymentMethod()}`
    };
  }

  /**
   * Check if payment is via PayOS
   */
  isPayOSPayment(): boolean {
    return this.paymentMethod === 'payos';
  }

  /**
   * Check if payment is cash
   */
  isCashPayment(): boolean {
    return this.paymentMethod === 'cash';
  }

  /**
   * Check if payment is via insurance
   */
  isInsurancePayment(): boolean {
    return this.paymentMethod === 'insurance_direct';
  }

  /**
   * Get payment category for reporting
   */
  getPaymentCategory(): 'electronic' | 'cash' | 'insurance' {
    switch (this.paymentMethod) {
      case 'cash':
        return 'cash';
      case 'insurance_direct':
        return 'insurance';
      case 'card':
      case 'bank_transfer':
      case 'payos':
      default:
        return 'electronic';
    }
  }
}
