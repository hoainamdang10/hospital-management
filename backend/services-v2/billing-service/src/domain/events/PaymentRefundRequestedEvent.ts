import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PaymentRefundRequestedEventData {
  refundId: string;
  originalPaymentId: string;
  invoiceId: string;
  staffId: string;
  patientId: string;
  appointmentId?: string;
  refundAmount: number;
  currency: string;
  reason: string;
  refundedBy: string;
  originalPaymentMethod: string;
  originalTransactionId?: string;
  vnpayTxnRef?: string;
  vnpayTransactionNo?: string;
  vnpayPayDate?: string;
}

export class PaymentRefundRequestedEvent extends DomainEvent {
  constructor(
    public readonly refundId: string,
    public readonly originalPaymentId: string,
    public readonly invoiceId: string,
    public readonly staffId: string,
    public readonly patientId: string,
    public readonly refundAmount: number,
    public readonly currency: string,
    public readonly reason: string,
    public readonly refundedBy: string,
    public readonly originalPaymentMethod: string,
    public readonly originalTransactionId?: string,
    public readonly appointmentId?: string,
    public readonly vnpayTxnRef?: string,
    public readonly vnpayTransactionNo?: string,
    public readonly vnpayPayDate?: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData: PaymentRefundRequestedEventData = {
      refundId,
      originalPaymentId,
      invoiceId,
      staffId,
      patientId,
      appointmentId,
      refundAmount,
      currency,
      reason,
      refundedBy,
      originalPaymentMethod,
      originalTransactionId,
      vnpayTxnRef,
      vnpayTransactionNo,
      vnpayPayDate
    };

    super(
      'billing.payment.refund_requested',
      invoiceId,
      'billing',
      eventData,
      1,
      correlationId,
      causationId,
      userIdForAudit
    );
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }

  public getPayload(): PaymentRefundRequestedEventData {
    return {
      refundId: this.refundId,
      originalPaymentId: this.originalPaymentId,
      invoiceId: this.invoiceId,
      staffId: this.staffId,
      patientId: this.patientId,
      appointmentId: this.appointmentId,
      refundAmount: this.refundAmount,
      currency: this.currency,
      reason: this.reason,
      refundedBy: this.refundedBy,
      originalPaymentMethod: this.originalPaymentMethod,
      originalTransactionId: this.originalTransactionId,
      vnpayTxnRef: this.vnpayTxnRef,
      vnpayTransactionNo: this.vnpayTransactionNo,
      vnpayPayDate: this.vnpayPayDate
    };
  }

  public getEventData(): any {
    return this.getPayload();
  }
}

