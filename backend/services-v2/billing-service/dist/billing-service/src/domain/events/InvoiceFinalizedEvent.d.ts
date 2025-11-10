import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface InvoiceFinalizedEventData {
    invoiceId: string;
    invoiceNumber: string;
    finalizedAt: Date;
}
export declare class InvoiceFinalizedEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly invoiceNumber: string;
    constructor(invoiceId: string, invoiceNumber: string, correlationId?: string, causationId?: string, userIdForAudit?: string);
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): InvoiceFinalizedEventData;
    getEventData(): any;
}
//# sourceMappingURL=InvoiceFinalizedEvent.d.ts.map