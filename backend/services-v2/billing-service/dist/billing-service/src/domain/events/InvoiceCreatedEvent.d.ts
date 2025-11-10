import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface InvoiceCreatedEventData {
    invoiceId: string;
    patientId: string;
    totalAmount: number;
    currency: string;
    status: string;
    timestamp: Date;
}
export declare class InvoiceCreatedEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly patientId: string;
    readonly totalAmount: number;
    readonly currency: string;
    readonly status: string;
    constructor(invoiceId: string, patientId: string, totalAmount: number, currency: string, status: string, correlationId?: string, causationId?: string, userIdForAudit?: string);
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): InvoiceCreatedEventData;
    getEventData(): any;
}
//# sourceMappingURL=InvoiceCreatedEvent.d.ts.map