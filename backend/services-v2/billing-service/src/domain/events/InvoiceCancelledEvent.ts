import { DomainEvent } from '@shared/domain/base/domain-event';

export interface InvoiceCancelledEventData {
  invoiceId: string;
  reason: string;
  cancelledAt: Date;
}

export class InvoiceCancelledEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly reason: string,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData: InvoiceCancelledEventData = {
      invoiceId,
      reason,
      cancelledAt: new Date()
    };

    super(
      'InvoiceCancelled',
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

  public getPayload(): InvoiceCancelledEventData {
    return {
      invoiceId: this.invoiceId,
      reason: this.reason,
      cancelledAt: this.occurredAt
    };
  }

  public getEventData(): any {
    return this.getPayload();
  }
}
