"use strict";
/**
 * PaymentPlanId - Value Object
 * Unique identifier for payment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Value Object Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentPlanId = void 0;
const uuid_1 = require("uuid");
class PaymentPlanId {
    constructor(value) {
        this._value = value;
    }
    static create() {
        const uuid = (0, uuid_1.v4)();
        return new PaymentPlanId(`PLAN-${uuid}`);
    }
    static fromString(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('PaymentPlanId cannot be empty');
        }
        return new PaymentPlanId(value);
    }
    get value() {
        return this._value;
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this._value === other._value;
    }
    toString() {
        return this._value;
    }
}
exports.PaymentPlanId = PaymentPlanId;
//# sourceMappingURL=PaymentPlanId.js.map