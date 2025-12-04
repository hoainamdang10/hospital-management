"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceCreatedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class InvoiceCreatedEvent extends domain_event_1.DomainEvent {
    constructor(invoiceId, invoiceNumber, patientId, totalAmount, currency, status, issuedAt, dueDate, correlationId, causationId, userIdForAudit) {
        const eventData = {
            invoiceId,
            invoiceNumber,
            patientId,
            totalAmount,
            currency,
            status,
            issuedAt,
            dueDate,
        };
        super("billing.invoice.generated", invoiceId, "billing", eventData, 1, correlationId, causationId, userIdForAudit);
        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
        this.patientId = patientId;
        this.totalAmount = totalAmount;
        this.currency = currency;
        this.status = status;
        this.issuedAt = issuedAt;
        this.dueDate = dueDate;
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
            invoiceNumber: this.invoiceNumber,
            patientId: this.patientId,
            totalAmount: this.totalAmount,
            currency: this.currency,
            status: this.status,
            issuedAt: this.issuedAt,
            dueDate: this.dueDate,
        };
    }
    getEventData() {
        return this.getPayload();
    }
}
exports.InvoiceCreatedEvent = InvoiceCreatedEvent;
//# sourceMappingURL=InvoiceCreatedEvent.js.map