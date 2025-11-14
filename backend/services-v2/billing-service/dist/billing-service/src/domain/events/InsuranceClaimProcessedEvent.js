"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsuranceClaimProcessedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class InsuranceClaimProcessedEvent extends domain_event_1.DomainEvent {
    constructor(invoiceId, claimAmount, currency, approved, correlationId, causationId, userIdForAudit) {
        const eventData = {
            invoiceId,
            claimAmount,
            currency,
            approved,
            processedAt: new Date()
        };
        super('insurance.claim.processed', invoiceId, 'billing', eventData, 1, correlationId, causationId, userIdForAudit);
        this.invoiceId = invoiceId;
        this.claimAmount = claimAmount;
        this.currency = currency;
        this.approved = approved;
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return null;
    }
    getPayload() {
        return {
            invoiceId: this.invoiceId,
            claimAmount: this.claimAmount,
            currency: this.currency,
            approved: this.approved,
            processedAt: this.occurredAt
        };
    }
    getEventData() {
        return this.getPayload();
    }
}
exports.InsuranceClaimProcessedEvent = InsuranceClaimProcessedEvent;
//# sourceMappingURL=InsuranceClaimProcessedEvent.js.map