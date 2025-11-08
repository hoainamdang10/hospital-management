"use strict";
/**
 * MedicalImagingId - Value Object
 * Unique identifier for medical imaging records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Value Object Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalImagingId = void 0;
const uuid_1 = require("uuid");
class MedicalImagingId {
    constructor(value) {
        this._value = value;
    }
    get value() {
        return this._value;
    }
    /**
     * Create new MedicalImagingId
     */
    static create() {
        const uuid = (0, uuid_1.v4)();
        return new MedicalImagingId(`IMG-${uuid}`);
    }
    /**
     * Create MedicalImagingId from existing string
     */
    static fromString(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('MedicalImagingId cannot be empty');
        }
        if (!value.startsWith('IMG-')) {
            throw new Error('MedicalImagingId must start with IMG- prefix');
        }
        return new MedicalImagingId(value);
    }
    /**
     * Check equality
     */
    equals(other) {
        if (!other) {
            return false;
        }
        return this._value === other._value;
    }
    /**
     * Convert to string
     */
    toString() {
        return this._value;
    }
}
exports.MedicalImagingId = MedicalImagingId;
//# sourceMappingURL=MedicalImagingId.js.map