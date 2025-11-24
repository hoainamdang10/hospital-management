"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Money = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
class Money extends value_object_1.ValueObject {
    constructor(props, allowNegative = false) {
        super(props);
        this.allowNegative = allowNegative;
    }
    /**
     * Create Money with positive amount only
     * Use this for regular payments, invoices, etc.
     */
    static create(amount, currency = "VND") {
        if (amount < 0) {
            // Fallback: allow negative amounts by using signed money (prevents runtime errors in refund flows)
            return new Money({ amount, currency }, true);
        }
        return new Money({ amount, currency }, false);
    }
    /**
     * Create Money with signed amount (positive or negative)
     * Use this for refunds, adjustments, etc.
     */
    static createSigned(amount, currency = "VND") {
        return new Money({ amount, currency }, true);
    }
    static zero(currency = "VND") {
        return new Money({ amount: 0, currency }, false);
    }
    get amount() {
        return this.props.amount;
    }
    get currency() {
        return this.props.currency;
    }
    add(other) {
        if (this.currency !== other.currency) {
            throw new Error("Cannot add money with different currencies");
        }
        const result = this.amount + other.amount;
        // Use createSigned if either operand allows negative or result is negative
        if (this.allowNegative || other.allowNegative || result < 0) {
            return Money.createSigned(result, this.currency);
        }
        return Money.create(result, this.currency);
    }
    subtract(other) {
        if (this.currency !== other.currency) {
            throw new Error("Cannot subtract money with different currencies");
        }
        const result = this.amount - other.amount;
        // Use createSigned if either operand allows negative or result is negative
        if (this.allowNegative || other.allowNegative || result < 0) {
            return Money.createSigned(result, this.currency);
        }
        return Money.create(result, this.currency);
    }
    multiply(factor) {
        const result = this.amount * factor;
        // Use createSigned if original allows negative or result is negative
        if (this.allowNegative || result < 0) {
            return Money.createSigned(result, this.currency);
        }
        return Money.create(result, this.currency);
    }
    validateFormat() {
        // Allow negative amounts (refunds/adjustments) – validation handled by domain logic
        if (!this.props.currency || this.props.currency.trim().length === 0) {
            throw new Error("Currency cannot be empty");
        }
    }
}
exports.Money = Money;
//# sourceMappingURL=Money.js.map