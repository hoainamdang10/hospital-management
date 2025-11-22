"use strict";
/**
 * Billing Service Domain Events
 * Shared event definitions for cross-service communication
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRefundedEvent = exports.PaymentRefundRequestedEvent = exports.ConsultationFeeUpdatedEvent = exports.InvoiceGeneratedEvent = exports.PaymentProcessedEvent = void 0;
const DomainEvent_1 = require("./DomainEvent");
/**
 * PaymentProcessed Event
 * Published when a payment is successfully processed
 */
class PaymentProcessedEvent extends DomainEvent_1.DomainEvent {
    constructor(paymentId, invoiceId, staffId, patientId, amount, consultationFee, paymentMethod, timestamp = new Date()) {
        super('billing.payment.processed', {
            paymentId,
            invoiceId,
            staffId,
            patientId,
            amount,
            consultationFee,
            paymentMethod,
            processedAt: timestamp
        }, timestamp);
    }
    get paymentId() {
        return this.data.paymentId;
    }
    get staffId() {
        return this.data.staffId;
    }
    get amount() {
        return this.data.amount;
    }
    get consultationFee() {
        return this.data.consultationFee;
    }
}
exports.PaymentProcessedEvent = PaymentProcessedEvent;
/**
 * InvoiceGenerated Event
 * Published when an invoice is generated for a consultation
 */
class InvoiceGeneratedEvent extends DomainEvent_1.DomainEvent {
    constructor(invoiceId, staffId, patientId, totalAmount, consultationFee, additionalCharges, appointmentId, timestamp = new Date()) {
        super('billing.invoice.generated', {
            invoiceId,
            staffId,
            patientId,
            appointmentId,
            totalAmount,
            consultationFee,
            additionalCharges,
            generatedAt: timestamp
        }, timestamp);
    }
    get invoiceId() {
        return this.data.invoiceId;
    }
    get staffId() {
        return this.data.staffId;
    }
    get totalAmount() {
        return this.data.totalAmount;
    }
    get consultationFee() {
        return this.data.consultationFee;
    }
}
exports.InvoiceGeneratedEvent = InvoiceGeneratedEvent;
/**
 * ConsultationFeeUpdated Event
 * Published when a staff member's consultation fee is updated
 */
class ConsultationFeeUpdatedEvent extends DomainEvent_1.DomainEvent {
    constructor(staffId, oldFee, newFee, updatedBy, effectiveDate, reason, timestamp = new Date()) {
        super('billing.consultation_fee.updated', {
            staffId,
            oldFee,
            newFee,
            updatedBy,
            reason,
            effectiveDate,
            updatedAt: timestamp
        }, timestamp);
    }
    get staffId() {
        return this.data.staffId;
    }
    get oldFee() {
        return this.data.oldFee;
    }
    get newFee() {
        return this.data.newFee;
    }
    get effectiveDate() {
        return this.data.effectiveDate;
    }
}
exports.ConsultationFeeUpdatedEvent = ConsultationFeeUpdatedEvent;
/**
 * PaymentRefundRequested Event
 * Published when a refund is requested and needs gateway processing
 */
class PaymentRefundRequestedEvent extends DomainEvent_1.DomainEvent {
    constructor(refundId, originalPaymentId, invoiceId, staffId, patientId, refundAmount, currency, reason, refundedBy, originalPaymentMethod, originalTransactionId, appointmentId, vnpayTxnRef, vnpayTransactionNo, vnpayPayDate, timestamp = new Date()) {
        super('billing.payment.refund_requested', {
            refundId,
            originalPaymentId,
            invoiceId,
            staffId,
            patientId,
            appointmentId,
            refundAmount,
            currency,
            reason,
            refundedBy,
            originalPaymentMethod,
            originalTransactionId,
            vnpayTxnRef,
            vnpayTransactionNo,
            vnpayPayDate
        }, timestamp);
    }
    get refundId() {
        return this.data.refundId;
    }
    get refundAmount() {
        return this.data.refundAmount;
    }
    get currency() {
        return this.data.currency;
    }
}
exports.PaymentRefundRequestedEvent = PaymentRefundRequestedEvent;
/**
 * PaymentRefunded Event
 * Published when a payment refund is completed (gateway confirmed)
 */
class PaymentRefundedEvent extends DomainEvent_1.DomainEvent {
    constructor(refundId, originalPaymentId, invoiceId, staffId, patientId, refundAmount, currency, reason, refundedBy, timestamp = new Date(), appointmentId, gatewayRefundId) {
        super('billing.payment.refunded', {
            refundId,
            originalPaymentId,
            invoiceId,
            staffId,
            patientId,
            appointmentId,
            refundAmount,
            currency,
            reason,
            refundedBy,
            gatewayRefundId,
            refundedAt: timestamp
        }, timestamp);
    }
    get refundId() {
        return this.data.refundId;
    }
    get staffId() {
        return this.data.staffId;
    }
    get refundAmount() {
        return this.data.refundAmount;
    }
    get currency() {
        return this.data.currency;
    }
    get appointmentId() {
        return this.data.appointmentId;
    }
    get gatewayRefundId() {
        return this.data.gatewayRefundId;
    }
}
exports.PaymentRefundedEvent = PaymentRefundedEvent;
//# sourceMappingURL=billing.events.js.map