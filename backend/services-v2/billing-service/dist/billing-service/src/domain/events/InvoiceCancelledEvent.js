"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceCancelledEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class InvoiceCancelledEvent extends domain_event_1.DomainEvent {
    constructor(invoiceId, reason, correlationId, causationId, userIdForAudit) {
        const eventData = {
            invoiceId,
            reason,
            cancelledAt: new Date()
        };
        super('InvoiceCancelled', invoiceId, 'Invoice', eventData, 1, correlationId, causationId, userIdForAudit);
        this.invoiceId = invoiceId;
        this.reason = reason;
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
            reason: this.reason,
            cancelledAt: this.occurredAt
        };
    }
    getEventData() {
        return this.getPayload();
    }
}
exports.InvoiceCancelledEvent = InvoiceCancelledEvent;
//# sourceMappingURL=InvoiceCancelledEvent.js.map