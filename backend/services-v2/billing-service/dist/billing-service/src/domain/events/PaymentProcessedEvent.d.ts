import { DomainEvent } from "../../../../shared/domain/base/domain-event";
export interface PaymentProcessedEventData {
    invoiceId: string;
    paymentId: string;
    patientId: string;
    amount: number;
    currency: string;
    method: string;
    processedAt: Date;
    appointmentId?: string;
}
export declare class PaymentProcessedEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly paymentId: string;
    readonly patientId: string;
    readonly amount: number;
    readonly currency: string;
    readonly method: string;
    readonly appointmentId?: string | undefined;
    constructor(invoiceId: string, paymentId: string, patientId: string, amount: number, currency: string, method: string, appointmentId?: string | undefined, correlationId?: string, causationId?: string, userIdForAudit?: string);
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PaymentProcessedEventData;
    getEventData(): any;
}
//# sourceMappingURL=PaymentProcessedEvent.d.ts.map