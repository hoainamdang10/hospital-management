import { DomainEvent } from "@shared/domain/base/domain-event";

export interface InvoiceCreatedEventData {
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  totalAmount: number;
  currency: string;
  status: string;
  issuedAt: Date;
  dueDate: Date;
}

export class InvoiceCreatedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly invoiceNumber: string,
    public readonly patientId: string,
    public readonly totalAmount: number,
    public readonly currency: string,
    public readonly status: string,
    public readonly issuedAt: Date,
    public readonly dueDate: Date,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string,
  ) {
    const eventData: InvoiceCreatedEventData = {
      invoiceId,
      invoiceNumber,
      patientId,
      totalAmount,
      currency,
      status,
      issuedAt,
      dueDate,
    };

    super(
      "billing.invoice.generated",
      invoiceId,
      "billing",
      eventData,
      1,
      correlationId,
      causationId,
      userIdForAudit,
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
      invoiceNumber: this.invoiceNumber,
      patientId: this.patientId,
      totalAmount: this.totalAmount,
      currency: this.currency,
      status: this.status,
      issuedAt: this.issuedAt,
      dueDate: this.dueDate,
    };
  }

  public getEventData(): any {
    return this.getPayload();
  }
}
