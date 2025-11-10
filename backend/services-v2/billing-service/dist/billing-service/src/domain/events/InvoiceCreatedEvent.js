"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceCreatedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class InvoiceCreatedEvent extends domain_event_1.DomainEvent {
    constructor(invoiceId, patientId, totalAmount, currency, status, correlationId, causationId, userIdForAudit) {
        const eventData = {
            invoiceId,
            patientId,
            totalAmount,
            currency,
            status,
            timestamp: new Date()
        };
        super('InvoiceCreated', invoiceId, 'Invoice', eventData, 1, correlationId, causationId, userIdForAudit);
        this.invoiceId = invoiceId;
        this.patientId = patientId;
        this.totalAmount = totalAmount;
        this.currency = currency;
        this.status = status;
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
    getPayload() {
        return {
            invoiceId: this.invoiceId,
            patientId: this.patientId,
            totalAmount: this.totalAmount,
            currency: this.currency,
            status: this.status,
            timestamp: this.occurredAt
        };
    }
    getEventData() {
        return this.getPayload();
    }
}
exports.InvoiceCreatedEvent = InvoiceCreatedEvent;
//# sourceMappingURL=InvoiceCreatedEvent.js.map