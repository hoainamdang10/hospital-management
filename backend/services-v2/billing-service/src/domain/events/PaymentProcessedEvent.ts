import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PaymentProcessedEventData {
  invoiceId: string;
  paymentId: string;
  amount: number;
  currency: string;
  method: string;
  processedAt: Date;
  appointmentId?: string; // Added for prepaid flow - link payment to appointment
}

export class PaymentProcessedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly method: string,
    public readonly appointmentId?: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData: PaymentProcessedEventData = {
      invoiceId,
      paymentId,
      amount,
      currency,
      method,
      processedAt: new Date(),
      appointmentId
    };

    super(
      'billing.payment.completed',
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
    return false;
  }

  public getPatientId(): string | null {
    return null;
  }

  public getPayload(): PaymentProcessedEventData {
    return {
      invoiceId: this.invoiceId,
      paymentId: this.paymentId,
      amount: this.amount,
      currency: this.currency,
      method: this.method,
      processedAt: this.occurredAt,
      appointmentId: this.appointmentId
    };
  }

  public getEventData(): any {
    return this.getPayload();
  }
}
