"use strict";
/**
 * UserId Value Object
 * User ID Format: USR-YYYYMM-XXX
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserId = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
const crypto_1 = require("crypto");
class UserId extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Validate format - required by ValueObject base class
     */
    validateFormat() {
        if (!this.props.value || this.props.value.trim().length === 0) {
            throw new Error('User ID không được để trống');
        }
    }
    static create(value) {
        return new UserId({ value: value.trim() });
    }
    static generate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        // Use crypto.randomBytes for secure random number generation
        const randomBuffer = (0, crypto_1.randomBytes)(2);
        const sequence = (randomBuffer.readUInt16BE(0) % 999) + 1;
        const sequenceStr = sequence.toString().padStart(3, '0');
        const userId = `USR-${year}${month}-${sequenceStr}`;
        return new UserId({ value: userId });
    }
    static fromUUID(uuid) {
        return new UserId({ value: uuid });
    }
    /**
     * Create UserId from existing string value
     * Used by repository when reconstituting from database
     */
    static fromString(value) {
        return new UserId({ value });
    }
    get value() {
        return this.props.value;
    }
    toString() {
        return this.props.value;
    }
}
exports.UserId = UserId;
//# sourceMappingURL=UserId.js.map