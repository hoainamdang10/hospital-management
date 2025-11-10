import { DomainEvent } from '@shared/domain/base/domain-event';

export interface InvoiceFinalizedEventData {
  invoiceId: string;
  invoiceNumber: string;
  finalizedAt: Date;
}

export class InvoiceFinalizedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly invoiceNumber: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData: InvoiceFinalizedEventData = {
      invoiceId,
      invoiceNumber,
      finalizedAt: new Date()
    };

    super(
      'InvoiceFinalized',
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
    return false;
  }

  public getPatientId(): string | null {
    return null;
  }

  public getPayload(): InvoiceFinalizedEventData {
    return {
      invoiceId: this.invoiceId,
      invoiceNumber: this.invoiceNumber,
      finalizedAt: this.occurredAt
    };
  }

  public getEventData(): any {
    return this.getPayload();
  }
}
