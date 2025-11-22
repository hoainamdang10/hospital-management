import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PaymentRefundRequestedEventData {
    refundId: string;
    originalPaymentId: string;
    invoiceId: string;
    staffId: string;
    patientId: string;
    appointmentId?: string;
    refundAmount: number;
    currency: string;
    reason: string;
    refundedBy: string;
    originalPaymentMethod: string;
    originalTransactionId?: string;
    vnpayTxnRef?: string;
    vnpayTransactionNo?: string;
    vnpayPayDate?: string;
}
export declare class PaymentRefundRequestedEvent extends DomainEvent {
    readonly refundId: string;
    readonly originalPaymentId: string;
    readonly invoiceId: string;
    readonly staffId: string;
    readonly patientId: string;
    readonly refundAmount: number;
    readonly currency: string;
    readonly reason: string;
    readonly refundedBy: string;
    readonly originalPaymentMethod: string;
    readonly originalTransactionId?: string | undefined;
    readonly appointmentId?: string | undefined;
    readonly vnpayTxnRef?: string | undefined;
    readonly vnpayTransactionNo?: string | undefined;
    readonly vnpayPayDate?: string | undefined;
    constructor(refundId: string, originalPaymentId: string, invoiceId: string, staffId: string, patientId: string, refundAmount: number, currency: string, reason: string, refundedBy: string, originalPaymentMethod: string, originalTransactionId?: string | undefined, appointmentId?: string | undefined, vnpayTxnRef?: string | undefined, vnpayTransactionNo?: string | undefined, vnpayPayDate?: string | undefined, correlationId?: string, causationId?: string, userIdForAudit?: string);
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PaymentRefundRequestedEventData;
    getEventData(): any;
}
//# sourceMappingURL=PaymentRefundRequestedEvent.d.ts.map