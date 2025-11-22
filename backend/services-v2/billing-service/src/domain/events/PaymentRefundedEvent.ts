import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PaymentRefundedEventData {
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
  gatewayRefundId?: string;
  refundedAt: Date;
}

export class PaymentRefundedEvent extends DomainEvent {
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
    public readonly refundedAt: Date,
    public readonly appointmentId?: string,
    public readonly gatewayRefundId?: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData: PaymentRefundedEventData = {
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
      gatewayRefundId,
      refundedAt
    };

    super(
      'billing.payment.refunded',
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

  public getPayload(): PaymentRefundedEventData {
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
      gatewayRefundId: this.gatewayRefundId,
      refundedAt: this.refundedAt
    };
  }

  public getEventData(): any {
    return this.getPayload();
  }
}

