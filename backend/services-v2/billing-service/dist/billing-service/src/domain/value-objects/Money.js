"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Money = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
class Money extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(amount, currency = 'VND') {
        if (amount < 0) {
            throw new Error('Amount cannot be negative');
        }
        return new Money({ amount, currency });
    }
    static zero(currency = 'VND') {
        return new Money({ amount: 0, currency });
    }
    get amount() {
        return this.props.amount;
    }
    get currency() {
        return this.props.currency;
    }
    add(other) {
        if (this.currency !== other.currency) {
            throw new Error('Cannot add money with different currencies');
        }
        return Money.create(this.amount + other.amount, this.currency);
    }
    subtract(other) {
        if (this.currency !== other.currency) {
            throw new Error('Cannot subtract money with different currencies');
        }
        return Money.create(this.amount - other.amount, this.currency);
    }
    multiply(factor) {
        return Money.create(this.amount * factor, this.currency);
    }
    validateFormat() {
        if (this.props.amount < 0) {
            throw new Error('Amount cannot be negative');
        }
        if (!this.props.currency || this.props.currency.trim().length === 0) {
            throw new Error('Currency cannot be empty');
        }
    }
}
exports.Money = Money;
//# sourceMappingURL=Money.js.map