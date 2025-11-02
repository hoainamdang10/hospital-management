"use strict";
/**
 * TreatmentPlanId Value Object - Treatment Plan Identifier
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentPlanId = void 0;
const value_object_1 = require("@shared/domain/base/value-object");
/**
 * Treatment Plan ID Value Object
 * Format: PLAN-YYYYMM-XXX (e.g., PLAN-202501-001)
 */
class TreatmentPlanId extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Create TreatmentPlanId from string
     */
    static create(value) {
        if (!value || value.trim() === '') {
            throw new Error('TreatmentPlanId không được để trống');
        }
        const trimmedValue = value.trim().toUpperCase();
        if (!this.FORMAT_REGEX.test(trimmedValue)) {
            throw new Error(`TreatmentPlanId phải có định dạng PLAN-YYYYMM-XXX (e.g., PLAN-202501-001), nhận được: ${trimmedValue}`);
        }
        return new TreatmentPlanId({ value: trimmedValue });
    }
    /**
     * Generate new TreatmentPlanId with current date
     */
    static generate(sequenceNumber) {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const sequence = sequenceNumber.toString().padStart(3, '0');
        const planId = `PLAN-${year}${month}-${sequence}`;
        return new TreatmentPlanId({ value: planId });
    }
    validateFormat() {
        if (!TreatmentPlanId.FORMAT_REGEX.test(this.props.value)) {
            throw new Error(`TreatmentPlanId không hợp lệ: ${this.props.value}. Định dạng yêu cầu: PLAN-YYYYMM-XXX`);
        }
        // Validate year and month
        const parts = this.props.value.split('-');
        const yearMonth = parts[1];
        const year = parseInt(yearMonth.substring(0, 4), 10);
        const month = parseInt(yearMonth.substring(4, 6), 10);
        const currentYear = new Date().getFullYear();
        if (year < 2020 || year > currentYear + 1) {
            throw new Error(`Năm không hợp lệ trong TreatmentPlanId: ${year}`);
        }
        if (month < 1 || month > 12) {
            throw new Error(`Tháng không hợp lệ trong TreatmentPlanId: ${month}`);
        }
        // Validate sequence number
        const sequence = parseInt(parts[2], 10);
        if (sequence < 1 || sequence > 999) {
            throw new Error(`Số thứ tự không hợp lệ trong TreatmentPlanId: ${sequence}`);
        }
    }
    /**
     * Get the value as string
     */
    get value() {
        return this.props.value;
    }
    /**
     * Get year from TreatmentPlanId
     */
    getYear() {
        const yearMonth = this.props.value.split('-')[1];
        return parseInt(yearMonth.substring(0, 4), 10);
    }
    /**
     * Get month from TreatmentPlanId
     */
    getMonth() {
        const yearMonth = this.props.value.split('-')[1];
        return parseInt(yearMonth.substring(4, 6), 10);
    }
    /**
     * Get sequence number from TreatmentPlanId
     */
    getSequence() {
        const sequence = this.props.value.split('-')[2];
        return parseInt(sequence, 10);
    }
    /**
     * Check if TreatmentPlanId is from current month
     */
    isCurrentMonth() {
        const now = new Date();
        return this.getYear() === now.getFullYear() && this.getMonth() === now.getMonth() + 1;
    }
    /**
     * Check if TreatmentPlanId is from current year
     */
    isCurrentYear() {
        return this.getYear() === new Date().getFullYear();
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            value: this.props.value,
            year: this.getYear(),
            month: this.getMonth(),
            sequence: this.getSequence()
        };
    }
    /**
     * Convert to string
     */
    toString() {
        return this.props.value;
    }
}
exports.TreatmentPlanId = TreatmentPlanId;
TreatmentPlanId.FORMAT_REGEX = /^PLAN-\d{6}-\d{3}$/;
//# sourceMappingURL=TreatmentPlanId.js.map