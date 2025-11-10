/**
 * Billing Service Domain Events
 * Shared event definitions for cross-service communication
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from './DomainEvent';
/**
 * PaymentProcessed Event
 * Published when a payment is successfully processed
 */
export declare class PaymentProcessedEvent extends DomainEvent<{
    paymentId: string;
    invoiceId: string;
    staffId: string;
    patientId: string;
    amount: number;
    consultationFee: number;
    paymentMethod: string;
    processedAt: Date;
}> {
    constructor(paymentId: string, invoiceId: string, staffId: string, patientId: string, amount: number, consultationFee: number, paymentMethod: string, timestamp?: Date);
    get paymentId(): string;
    get staffId(): string;
    get amount(): number;
    get consultationFee(): number;
}
/**
 * InvoiceGenerated Event
 * Published when an invoice is generated for a consultation
 */
export declare class InvoiceGeneratedEvent extends DomainEvent<{
    invoiceId: string;
    staffId: string;
    patientId: string;
    appointmentId?: string;
    totalAmount: number;
    consultationFee: number;
    additionalCharges: number;
    generatedAt: Date;
}> {
    constructor(invoiceId: string, staffId: string, patientId: string, totalAmount: number, consultationFee: number, additionalCharges: number, appointmentId?: string, timestamp?: Date);
    get invoiceId(): string;
    get staffId(): string;
    get totalAmount(): number;
    get consultationFee(): number;
}
/**
 * ConsultationFeeUpdated Event
 * Published when a staff member's consultation fee is updated
 */
export declare class ConsultationFeeUpdatedEvent extends DomainEvent<{
    staffId: string;
    oldFee: number;
    newFee: number;
    updatedBy: string;
    reason?: string;
    effectiveDate: Date;
    updatedAt: Date;
}> {
    constructor(staffId: string, oldFee: number, newFee: number, updatedBy: string, effectiveDate: Date, reason?: string, timestamp?: Date);
    get staffId(): string;
    get oldFee(): number;
    get newFee(): number;
    get effectiveDate(): Date;
}
/**
 * PaymentRefunded Event
 * Published when a payment is refunded
 */
export declare class PaymentRefundedEvent extends DomainEvent<{
    refundId: string;
    paymentId: string;
    invoiceId: string;
    staffId: string;
    patientId: string;
    refundAmount: number;
    reason: string;
    refundedBy: string;
    refundedAt: Date;
}> {
    constructor(refundId: string, paymentId: string, invoiceId: string, staffId: string, patientId: string, refundAmount: number, reason: string, refundedBy: string, timestamp?: Date);
    get refundId(): string;
    get staffId(): string;
    get refundAmount(): number;
}
//# sourceMappingURL=billing.events.d.ts.map