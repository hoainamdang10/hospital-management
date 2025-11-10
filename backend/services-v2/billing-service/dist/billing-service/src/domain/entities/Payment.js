"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const entity_1 = require("../../../../shared/domain/base/entity");
class Payment extends entity_1.Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(amount, method, transactionId, id) {
        return new Payment({
            id: id || '',
            amount,
            method,
            status: 'pending',
            transactionId,
            paidAt: undefined,
            refundedAt: undefined
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
        if (this.props.amount.amount <= 0) {
            throw new Error('Payment amount must be greater than 0');
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
            refundedAt: this.props.refundedAt
        };
    }
}
exports.Payment = Payment;
//# sourceMappingURL=Payment.js.map