import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface InsuranceClaimProcessedEventData {
    invoiceId: string;
    claimAmount: number;
    currency: string;
    approved: boolean;
    processedAt: Date;
}
export declare class InsuranceClaimProcessedEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly claimAmount: number;
    readonly currency: string;
    readonly approved: boolean;
    constructor(invoiceId: string, claimAmount: number, currency: string, approved: boolean, correlationId?: string, causationId?: string, userIdForAudit?: string);
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): InsuranceClaimProcessedEventData;
    getEventData(): any;
}
//# sourceMappingURL=InsuranceClaimProcessedEvent.d.ts.map