import { DomainEvent } from '@shared/domain/base/domain-event';

export interface InvoiceCreatedEventData {
  invoiceId: string;
  patientId: string;
  totalAmount: number;
  currency: string;
  status: string;
  timestamp: Date;
}

export class InvoiceCreatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly patientId: string,
    public readonly totalAmount: number,
    public readonly currency: string,
    public readonly status: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData: InvoiceCreatedEventData = {
      invoiceId,
      patientId,
      totalAmount,
      currency,
      status,
      timestamp: new Date()
    };

    super(
      'InvoiceCreated',
      invoiceId,
      'Invoice',
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

  public getPayload(): InvoiceCreatedEventData {
    return {
      invoiceId: this.invoiceId,
      patientId: this.patientId,
      totalAmount: this.totalAmount,
      currency: this.currency,
      status: this.status,
      timestamp: this.occurredAt
    };
  }

  public getEventData(): any {
    return this.getPayload();
  }
}
