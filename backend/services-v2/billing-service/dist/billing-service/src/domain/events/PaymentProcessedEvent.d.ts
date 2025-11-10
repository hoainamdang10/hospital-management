import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PaymentProcessedEventData {
    invoiceId: string;
    paymentId: string;
    amount: number;
    currency: string;
    method: string;
    processedAt: Date;
}
export declare class PaymentProcessedEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly paymentId: string;
    readonly amount: number;
    readonly currency: string;
    readonly method: string;
    constructor(invoiceId: string, paymentId: string, amount: number, currency: string, method: string, correlationId?: string, causationId?: string, userIdForAudit?: string);
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PaymentProcessedEventData;
    getEventData(): any;
}
//# sourceMappingURL=PaymentProcessedEvent.d.ts.map