import { DomainEvent } from "../../../../shared/domain/base/domain-event";
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
export declare class InvoiceCreatedEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly invoiceNumber: string;
    readonly patientId: string;
    readonly totalAmount: number;
    readonly currency: string;
    readonly status: string;
    readonly issuedAt: Date;
    readonly dueDate: Date;
    constructor(invoiceId: string, invoiceNumber: string, patientId: string, totalAmount: number, currency: string, status: string, issuedAt: Date, dueDate: Date, correlationId?: string, causationId?: string, userIdForAudit?: string);
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): InvoiceCreatedEventData;
    getEventData(): any;
}
//# sourceMappingURL=InvoiceCreatedEvent.d.ts.map