"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const entity_1 = require("../../../../shared/domain/base/entity");
const Money_1 = require("../value-objects/Money");
class Payment extends entity_1.Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(amount, method, transactionId, id, vnpayData) {
        return new Payment({
            id: id || '',
            amount,
            method,
            status: method === 'refund' ? 'refund_pending' : 'pending',
            transactionId,
            paidAt: undefined,
            refundedAt: undefined,
            refundReason: undefined,
            refundedBy: undefined,
            gatewayRefundId: undefined,
            vnpayData
        }, id);
    }
    /**
     * Create a refund payment record
     * This represents money being returned to the patient
     * Amount will be stored as negative value to represent outflow
     */
    static createRefund(amount, originalPaymentMethod, transactionId, reason, refundedBy, id) {
        return new Payment({
            id: id || '',
            amount: Money_1.Money.createSigned(-Math.abs(amount.amount), amount.currency), // Negative amount for refund
            method: 'refund',
            status: 'refund_pending', // Will be updated when gateway confirms
            transactionId,
            paidAt: undefined,
            refundedAt: undefined,
            refundReason: reason,
            refundedBy: refundedBy,
            gatewayRefundId: undefined // Will be set when gateway processes refund
        }, id);
    }
    get amount() {
        return this.props.amount;
    }
    get method() {
        return this.props.method;
    }
    get status() {
        return this.props.status;
    }
    get transactionId() {
        return this.props.transactionId;
    }
    get paidAt() {
        return this.props.paidAt;
    }
    get vnpayData() {
        return this.props.vnpayData;
    }
    get refundReason() {
        return this.props.refundReason;
    }
    get refundedBy() {
        return this.props.refundedBy;
    }
    get gatewayRefundId() {
        return this.props.gatewayRefundId;
    }
    get refundedAt() {
        return this.props.refundedAt;
    }
    complete() {
        if (this.props.status !== 'pending') {
            throw new Error('Can only complete pending payments');
        }
        this.props.status = 'completed';
        this.props.paidAt = new Date();
    }
    fail() {
        if (this.props.status !== 'pending') {
            throw new Error('Can only fail pending payments');
        }
        this.props.status = 'failed';
    }
    refund() {
        if (this.props.status !== 'completed') {
            throw new Error('Can only refund completed payments');
        }
        this.props.status = 'refunded';
        this.props.refundedAt = new Date();
    }
    validate() {
        // Allow negative amounts for refund payments
        if (this.props.method !== 'refund' && this.props.amount.amount <= 0) {
            throw new Error('Payment amount must be greater than 0');
        }
        if (this.props.method === 'refund' && this.props.amount.amount >= 0) {
            throw new Error('Refund payment amount must be negative');
        }
    }
    /**
     * Mark refund as completed (when gateway confirms)
     */
    completeRefund(gatewayRefundId) {
        if (this.props.method !== 'refund') {
            throw new Error('Can only complete refund for refund payments');
        }
        if (this.props.status !== 'refund_pending') {
            throw new Error('Can only complete pending refunds');
        }
        this.props.status = 'completed';
        this.props.refundedAt = new Date();
        if (gatewayRefundId) {
            this.props.gatewayRefundId = gatewayRefundId;
        }
    }
    toPersistence() {
        return {
            id: this.id,
            amount: this.props.amount.amount,
            currency: this.props.amount.currency,
            method: this.props.method,
            status: this.props.status,
            transactionId: this.props.transactionId,
            paidAt: this.props.paidAt,
            refundedAt: this.props.refundedAt,
            refundReason: this.props.refundReason,
            refundedBy: this.props.refundedBy,
            gatewayRefundId: this.props.gatewayRefundId,
            vnpayData: this.props.vnpayData
        };
    }
}
exports.Payment = Payment;
//# sourceMappingURL=Payment.js.map