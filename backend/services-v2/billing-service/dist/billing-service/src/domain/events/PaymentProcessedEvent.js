"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProcessedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class PaymentProcessedEvent extends domain_event_1.DomainEvent {
    constructor(invoiceId, paymentId, amount, currency, method, correlationId, causationId, userIdForAudit) {
        const eventData = {
            invoiceId,
            paymentId,
            amount,
            currency,
            method,
            processedAt: new Date()
        };
        super('payment.completed', invoiceId, 'billing', eventData, 1, correlationId, causationId, userIdForAudit);
        this.invoiceId = invoiceId;
        this.paymentId = paymentId;
        this.amount = amount;
        this.currency = currency;
        this.method = method;
    }
    containsPHI() {
        return false;
    }
    getPatientId() {
        return null;
    }
    getPayload() {
        return {
            invoiceId: this.invoiceId,
            paymentId: this.paymentId,
            amount: this.amount,
            currency: this.currency,
            method: this.method,
            processedAt: this.occurredAt
        };
    }
    getEventData() {
        return this.getPayload();
    }
}
exports.PaymentProcessedEvent = PaymentProcessedEvent;
//# sourceMappingURL=PaymentProcessedEvent.js.map