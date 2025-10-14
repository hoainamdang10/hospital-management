"use strict";
/**
 * StaffId Value Object
 * Staff ID Format: STF-YYYYMM-XXX
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffId = void 0;
const value_object_1 = require("../../../../shared/domain/base/value-object");
const crypto_1 = require("crypto");
class StaffId extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Validate format - required by ValueObject base class
     */
    validateFormat() {
        if (!this.props.value || this.props.value.trim().length === 0) {
            throw new Error('Staff ID không được để trống');
        }
    }
    static create(value) {
        return new StaffId({ value: value.trim() });
    }
    /**
     * Generate new Staff ID with format STF-YYYYMM-XXX
     */
    static generate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = (0, crypto_1.randomBytes)(2).toString('hex').toUpperCase();
        const value = `STF-${year}${month}-${random}`;
        return new StaffId({ value });
    }
    /**
     * Create StaffId from UUID (for compatibility)
     */
    static fromUUID(uuid) {
        const shortId = uuid.substring(0, 8).toUpperCase();
        return new StaffId({ value: `STF-${shortId}` });
    }
    /**
     * Create StaffId from existing string value
     * Used by repository when reconstituting from database
     */
    static fromString(value) {
        return new StaffId({ value });
    }
    get value() {
        return this.props.value;
    }
    toString() {
        return this.props.value;
    }
}
exports.StaffId = StaffId;
//# sourceMappingURL=StaffId.js.map