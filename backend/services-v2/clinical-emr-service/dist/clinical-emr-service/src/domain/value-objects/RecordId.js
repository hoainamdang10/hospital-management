"use strict";
/**
 * RecordId Value Object - Clinical EMR Service
 * Vietnamese Medical Record ID format: MED-YYYYMM-XXX
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordId = void 0;
const value_object_1 = require("@shared/domain/base/value-object");
class RecordId extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    validateFormat() {
        this.validate();
    }
    /**
     * Create RecordId from string value
     */
    static create(value) {
        return new RecordId({ value: value.trim().toUpperCase() });
    }
    /**
     * Generate new RecordId with Vietnamese format: MED-YYYYMM-XXX
     */
    static generate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        // Generate random 3-digit sequence
        const sequence = Math.floor(Math.random() * 999) + 1;
        const sequenceStr = sequence.toString().padStart(3, '0');
        const recordId = `MED-${year}${month}-${sequenceStr}`;
        return new RecordId({ value: recordId });
    }
    /**
     * Generate RecordId with specific sequence (for testing)
     */
    static generateWithSequence(sequence) {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const sequenceStr = sequence.toString().padStart(3, '0');
        const recordId = `MED-${year}${month}-${sequenceStr}`;
        return new RecordId({ value: recordId });
    }
    /**
     * Validate RecordId format
     */
    validate() {
        const { value } = this.props;
        if (!value) {
            throw new Error('RecordId không được để trống');
        }
        // Vietnamese Medical Record ID format: MED-YYYYMM-XXX
        const recordIdRegex = /^MED-\d{6}-\d{3}$/;
        if (!recordIdRegex.test(value)) {
            throw new Error('RecordId phải có định dạng MED-YYYYMM-XXX (ví dụ: MED-202501-001)');
        }
        // Validate year and month
        const yearMonth = value.substring(4, 10);
        const year = parseInt(yearMonth.substring(0, 4));
        const month = parseInt(yearMonth.substring(4, 6));
        const currentYear = new Date().getFullYear();
        if (year < 2020 || year > currentYear + 1) {
            throw new Error(`Năm trong RecordId phải từ 2020 đến ${currentYear + 1}`);
        }
        if (month < 1 || month > 12) {
            throw new Error('Tháng trong RecordId phải từ 01 đến 12');
        }
        // Validate sequence
        const sequence = parseInt(value.substring(11, 14));
        if (sequence < 1 || sequence > 999) {
            throw new Error('Số thứ tự trong RecordId phải từ 001 đến 999');
        }
    }
    /**
     * Get string value
     */
    get value() {
        return this.props.value;
    }
    /**
     * Get year from RecordId
     */
    getYear() {
        return parseInt(this.props.value.substring(4, 8));
    }
    /**
     * Get month from RecordId
     */
    getMonth() {
        return parseInt(this.props.value.substring(8, 10));
    }
    /**
     * Get sequence number from RecordId
     */
    getSequence() {
        return parseInt(this.props.value.substring(11, 14));
    }
    /**
     * Get year-month string (YYYYMM)
     */
    getYearMonth() {
        return this.props.value.substring(4, 10);
    }
    /**
     * Check if RecordId is from current month
     */
    isCurrentMonth() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        return this.getYear() === currentYear && this.getMonth() === currentMonth;
    }
    /**
     * Check if RecordId is from current year
     */
    isCurrentYear() {
        const currentYear = new Date().getFullYear();
        return this.getYear() === currentYear;
    }
    /**
     * Convert to string
     */
    toString() {
        return this.props.value;
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return this.props.value;
    }
    /**
     * Create from database value
     */
    static fromDatabase(value) {
        if (!value)
            return null;
        return RecordId.create(value);
    }
    /**
     * Convert to database value
     */
    toDatabase() {
        return this.props.value;
    }
}
exports.RecordId = RecordId;
//# sourceMappingURL=RecordId.js.map