import { DomainEvent } from '@shared/domain/base/domain-event';

export interface InsuranceClaimProcessedEventData {
  invoiceId: string;
  claimAmount: number;
  currency: string;
  approved: boolean;
  processedAt: Date;
}

export class InsuranceClaimProcessedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly claimAmount: number,
    public readonly currency: string,
    public readonly approved: boolean,
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData: InsuranceClaimProcessedEventData = {
      invoiceId,
      claimAmount,
      currency,
      approved,
      processedAt: new Date()
    };

    super(
      'InsuranceClaimProcessed',
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
    return null;
  }

  public getPayload(): InsuranceClaimProcessedEventData {
    return {
      invoiceId: this.invoiceId,
      claimAmount: this.claimAmount,
      currency: this.currency,
      approved: this.approved,
      processedAt: this.occurredAt
    };
  }

  public getEventData(): any {
    return this.getPayload();
  }
}
