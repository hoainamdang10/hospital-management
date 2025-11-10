"use strict";
/**
 * InstallmentId - Value Object
 * Unique identifier for installments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Value Object Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallmentId = void 0;
const uuid_1 = require("uuid");
class InstallmentId {
    constructor(value) {
        this._value = value;
    }
    static create() {
        const uuid = (0, uuid_1.v4)();
        return new InstallmentId(`INST-${uuid}`);
    }
    static fromString(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('InstallmentId cannot be empty');
        }
        return new InstallmentId(value);
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
exports.InstallmentId = InstallmentId;
//# sourceMappingURL=InstallmentId.js.map