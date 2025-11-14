"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceFinalizedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class InvoiceFinalizedEvent extends domain_event_1.DomainEvent {
    constructor(invoiceId, invoiceNumber, correlationId, causationId, userIdForAudit) {
        const eventData = {
            invoiceId,
            invoiceNumber,
            finalizedAt: new Date()
        };
        super('invoice.finalized', invoiceId, 'billing', eventData, 1, correlationId, causationId, userIdForAudit);
        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
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
            invoiceNumber: this.invoiceNumber,
            finalizedAt: this.occurredAt
        };
    }
    getEventData() {
        return this.getPayload();
    }
}
exports.InvoiceFinalizedEvent = InvoiceFinalizedEvent;
//# sourceMappingURL=InvoiceFinalizedEvent.js.map