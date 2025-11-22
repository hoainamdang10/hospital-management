import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PaymentRefundedEventData {
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
    gatewayRefundId?: string;
    refundedAt: Date;
}
export declare class PaymentRefundedEvent extends DomainEvent {
    readonly refundId: string;
    readonly originalPaymentId: string;
    readonly invoiceId: string;
    readonly staffId: string;
    readonly patientId: string;
    readonly refundAmount: number;
    readonly currency: string;
    readonly reason: string;
    readonly refundedBy: string;
    readonly refundedAt: Date;
    readonly appointmentId?: string | undefined;
    readonly gatewayRefundId?: string | undefined;
    constructor(refundId: string, originalPaymentId: string, invoiceId: string, staffId: string, patientId: string, refundAmount: number, currency: string, reason: string, refundedBy: string, refundedAt: Date, appointmentId?: string | undefined, gatewayRefundId?: string | undefined, correlationId?: string, causationId?: string, userIdForAudit?: string);
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PaymentRefundedEventData;
    getEventData(): any;
}
//# sourceMappingURL=PaymentRefundedEvent.d.ts.map