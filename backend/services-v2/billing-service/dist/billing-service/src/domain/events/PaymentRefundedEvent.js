"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRefundedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class PaymentRefundedEvent extends domain_event_1.DomainEvent {
    constructor(refundId, originalPaymentId, invoiceId, staffId, patientId, refundAmount, currency, reason, refundedBy, refundedAt, appointmentId, gatewayRefundId, correlationId, causationId, userIdForAudit) {
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
            gatewayRefundId,
            refundedAt
        };
        super('billing.payment.refunded', invoiceId, 'billing', eventData, 1, correlationId, causationId, userIdForAudit);
        this.refundId = refundId;
        this.originalPaymentId = originalPaymentId;
        this.invoiceId = invoiceId;
        this.staffId = staffId;
        this.patientId = patientId;
        this.refundAmount = refundAmount;
        this.currency = currency;
        this.reason = reason;
        this.refundedBy = refundedBy;
        this.refundedAt = refundedAt;
        this.appointmentId = appointmentId;
        this.gatewayRefundId = gatewayRefundId;
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
            gatewayRefundId: this.gatewayRefundId,
            refundedAt: this.refundedAt
        };
    }
    getEventData() {
        return this.getPayload();
    }
}
exports.PaymentRefundedEvent = PaymentRefundedEvent;
//# sourceMappingURL=PaymentRefundedEvent.js.map