import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface InvoiceCancelledEventData {
    invoiceId: string;
    reason: string;
    cancelledAt: Date;
}
export declare class InvoiceCancelledEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly reason: string;
    constructor(invoiceId: string, reason: string, correlationId?: string, causationId?: string, userIdForAudit?: string);
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): InvoiceCancelledEventData;
    getEventData(): any;
}
//# sourceMappingURL=InvoiceCancelledEvent.d.ts.map