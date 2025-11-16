import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PaymentLinkCreatedEventData {
  invoiceId: string;
  patientId: string;
  orderCode: number;
  checkoutUrl: string;
  qrCode: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: Date;
}

/**
 * Event emitted when a PayOS payment link is created for an invoice
 * This event can be consumed by:
 * - Notifications Service: Send payment link to patient via email/SMS
 * - Frontend: Display QR code and checkout URL
 * - Analytics: Track payment link generation
 */
export class PaymentLinkCreatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly patientId: string,
    public readonly orderCode: number,
    public readonly checkoutUrl: string,
    public readonly qrCode: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly description: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData: PaymentLinkCreatedEventData = {
      invoiceId,
      patientId,
      orderCode,
      checkoutUrl,
      qrCode,
      amount,
      currency,
      description,
      createdAt: new Date()
    };

    super(
      'billing.payment_link.created', // Convention: <service>.<entity>.<action>
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
    return true; // Contains patient ID
  }

  public getPatientId(): string | null {
    return this.patientId;
  }

  public getPayload(): PaymentLinkCreatedEventData {
    return {
      invoiceId: this.invoiceId,
      patientId: this.patientId,
      orderCode: this.orderCode,
      checkoutUrl: this.checkoutUrl,
      qrCode: this.qrCode,
      amount: this.amount,
      currency: this.currency,
      description: this.description,
      createdAt: this.occurredAt
    };
  }

  public getEventData(): any {
    return this.getPayload();
  }
}