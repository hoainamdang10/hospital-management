"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProcessedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class PaymentProcessedEvent extends domain_event_1.DomainEvent {
    constructor(invoiceId, paymentId, patientId, amount, currency, method, appointmentId, correlationId, causationId, userIdForAudit) {
        const eventData = {
            invoiceId,
            paymentId,
            patientId,
            amount,
            currency,
            method,
            processedAt: new Date(),
            appointmentId,
        };
        super("billing.payment.completed", invoiceId, "billing", eventData, 1, correlationId, causationId, userIdForAudit);
        this.invoiceId = invoiceId;
        this.paymentId = paymentId;
        this.patientId = patientId;
        this.amount = amount;
        this.currency = currency;
        this.method = method;
        this.appointmentId = appointmentId;
    }
    containsPHI() {
        return false;
    }
    getPatientId() {
        return this.patientId;
    }
    getPayload() {
        return {
            invoiceId: this.invoiceId,
            paymentId: this.paymentId,
            patientId: this.patientId,
            amount: this.amount,
            currency: this.currency,
            method: this.method,
            processedAt: this.occurredAt,
            appointmentId: this.appointmentId,
        };
    }
    getEventData() {
        return this.getPayload();
    }
}
exports.PaymentProcessedEvent = PaymentProcessedEvent;
//# sourceMappingURL=PaymentProcessedEvent.js.map