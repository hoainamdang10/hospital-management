"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRefundRequestedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class PaymentRefundRequestedEvent extends domain_event_1.DomainEvent {
    constructor(refundId, originalPaymentId, invoiceId, staffId, patientId, refundAmount, currency, reason, refundedBy, originalPaymentMethod, originalTransactionId, appointmentId, vnpayTxnRef, vnpayTransactionNo, vnpayPayDate, correlationId, causationId, userIdForAudit) {
        const eventData = {
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
        };
        super('billing.payment.refund_requested', invoiceId, 'billing', eventData, 1, correlationId, causationId, userIdForAudit);
        this.refundId = refundId;
        this.originalPaymentId = originalPaymentId;
        this.invoiceId = invoiceId;
        this.staffId = staffId;
        this.patientId = patientId;
        this.refundAmount = refundAmount;
        this.currency = currency;
        this.reason = reason;
        this.refundedBy = refundedBy;
        this.originalPaymentMethod = originalPaymentMethod;
        this.originalTransactionId = originalTransactionId;
        this.appointmentId = appointmentId;
        this.vnpayTxnRef = vnpayTxnRef;
        this.vnpayTransactionNo = vnpayTransactionNo;
        this.vnpayPayDate = vnpayPayDate;
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
    getPayload() {
        return {
            refundId: this.refundId,
            originalPaymentId: this.originalPaymentId,
            invoiceId: this.invoiceId,
            staffId: this.staffId,
            patientId: this.patientId,
            appointmentId: this.appointmentId,
            refundAmount: this.refundAmount,
            currency: this.currency,
            reason: this.reason,
            refundedBy: this.refundedBy,
            originalPaymentMethod: this.originalPaymentMethod,
            originalTransactionId: this.originalTransactionId,
            vnpayTxnRef: this.vnpayTxnRef,
            vnpayTransactionNo: this.vnpayTransactionNo,
            vnpayPayDate: this.vnpayPayDate
        };
    }
    getEventData() {
        return this.getPayload();
    }
}
exports.PaymentRefundRequestedEvent = PaymentRefundRequestedEvent;
//# sourceMappingURL=PaymentRefundRequestedEvent.js.map