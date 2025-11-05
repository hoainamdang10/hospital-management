"use strict";
/**
 * PaymentProcessedEvent - Domain Event
 * Raised when a payment is processed for an invoice
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProcessedEvent = void 0;
class PaymentProcessedEvent {
    constructor(invoiceId, patientId, paymentId, amount, currency, paymentMethod, transactionId, processedBy, occurredAt) {
        this.invoiceId = invoiceId;
        this.patientId = patientId;
        this.paymentId = paymentId;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.processedBy = processedBy;
        this.eventVersion = 1;
        this.eventId = `payment-processed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.aggregateId = invoiceId;
        this.occurredAt = occurredAt;
    }
    /**
     * Get event name
     */
    getEventName() {
        return 'PaymentProcessedEvent';
    }
    /**
     * Get aggregate type
     */
    getAggregateType() {
        return 'BillingAggregate';
    }
    /**
     * Get Vietnamese payment method
     */
    getVietnamesePaymentMethod() {
        switch (this.paymentMethod) {
            case 'cash': return 'Tiền mặt';
            case 'card': return 'Thẻ';
            case 'bank_transfer': return 'Chuyển khoản';
            case 'payos': return 'PayOS';
            case 'insurance_direct': return 'Bảo hiểm trực tiếp';
            default: return 'Khác';
        }
    }
    /**
     * Format amount for Vietnamese display
     */
    getVietnameseAmountDisplay() {
        if (this.currency === 'VND') {
            return `${this.amount.toLocaleString('vi-VN')} đ`;
        }
        return `${this.amount.toLocaleString()} ${this.currency}`;
    }
    /**
     * Get event data
     */
    getEventData() {
        return {
            invoiceId: this.invoiceId,
            patientId: this.patientId,
            paymentId: this.paymentId,
            amount: this.amount,
            currency: this.currency,
            paymentMethod: this.paymentMethod,
            vietnamesePaymentMethod: this.getVietnamesePaymentMethod(),
            vietnameseAmountDisplay: this.getVietnameseAmountDisplay(),
            transactionId: this.transactionId,
            processedBy: this.processedBy,
            occurredAt: this.occurredAt.toISOString(),
            eventVersion: this.eventVersion,
            vietnameseDescription: `Thanh toán ${this.getVietnameseAmountDisplay()} bằng ${this.getVietnamesePaymentMethod()}`
        };
    }
    /**
     * Check if payment is via PayOS
     */
    isPayOSPayment() {
        return this.paymentMethod === 'payos';
    }
    /**
     * Check if payment is cash
     */
    isCashPayment() {
        return this.paymentMethod === 'cash';
    }
    /**
     * Check if payment is via insurance
     */
    isInsurancePayment() {
        return this.paymentMethod === 'insurance_direct';
    }
    /**
     * Get payment category for reporting
     */
    getPaymentCategory() {
        switch (this.paymentMethod) {
            case 'cash':
                return 'cash';
            case 'insurance_direct':
                return 'insurance';
            case 'card':
            case 'bank_transfer':
            case 'payos':
            default:
                return 'electronic';
        }
    }
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            eventId: this.eventId,
            eventName: this.getEventName(),
            aggregateId: this.aggregateId,
            aggregateType: this.getAggregateType(),
            eventVersion: this.eventVersion,
            occurredAt: this.occurredAt.toISOString(),
            eventData: this.getEventData(),
            paymentCategory: this.getPaymentCategory(),
            isPayOSPayment: this.isPayOSPayment(),
            isCashPayment: this.isCashPayment(),
            isInsurancePayment: this.isInsurancePayment()
        };
    }
}
exports.PaymentProcessedEvent = PaymentProcessedEvent;
//# sourceMappingURL=PaymentProcessedEvent.js.map