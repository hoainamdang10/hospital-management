"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentLinkCreatedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
/**
 * Event emitted when a PayOS payment link is created for an invoice
 * This event can be consumed by:
 * - Notifications Service: Send payment link to patient via email/SMS
 * - Frontend: Display QR code and checkout URL
 * - Analytics: Track payment link generation
 */
class PaymentLinkCreatedEvent extends domain_event_1.DomainEvent {
    constructor(invoiceId, patientId, orderCode, checkoutUrl, qrCode, amount, currency, description, correlationId, causationId, userIdForAudit) {
        const eventData = {
            invoiceId,
            patientId,
            orderCode,
            checkoutUrl,
            qrCode,
            amount,
            currency,
            description,
            createdAt: new Date()
        };
        super('billing.payment_link.created', // Convention: <service>.<entity>.<action>
        invoiceId, 'billing', eventData, 1, correlationId, causationId, userIdForAudit);
        this.invoiceId = invoiceId;
        this.patientId = patientId;
        this.orderCode = orderCode;
        this.checkoutUrl = checkoutUrl;
        this.qrCode = qrCode;
        this.amount = amount;
        this.currency = currency;
        this.description = description;
    }
    containsPHI() {
        return true; // Contains patient ID
    }
    getPatientId() {
        return this.patientId;
    }
    getPayload() {
        return {
            invoiceId: this.invoiceId,
            patientId: this.patientId,
            orderCode: this.orderCode,
            checkoutUrl: this.checkoutUrl,
            qrCode: this.qrCode,
            amount: this.amount,
            currency: this.currency,
            description: this.description,
            createdAt: this.occurredAt
        };
    }
    getEventData() {
        return this.getPayload();
    }
}
exports.PaymentLinkCreatedEvent = PaymentLinkCreatedEvent;
//# sourceMappingURL=PaymentLinkCreatedEvent.js.map