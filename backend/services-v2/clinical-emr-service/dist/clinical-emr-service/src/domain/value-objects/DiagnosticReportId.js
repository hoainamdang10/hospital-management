"use strict";
/**
 * DiagnosticReportId Value Object - Diagnostic Report Identifier
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticReportId = void 0;
const value_object_1 = require("@shared/domain/base/value-object");
/**
 * Diagnostic Report ID Value Object
 * Format: DIAG-YYYYMM-XXX (e.g., DIAG-202501-001)
 */
class DiagnosticReportId extends value_object_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Create DiagnosticReportId from string
     */
    static create(value) {
        if (!value || value.trim() === '') {
            throw new Error('DiagnosticReportId không được để trống');
        }
        const trimmedValue = value.trim().toUpperCase();
        if (!this.FORMAT_REGEX.test(trimmedValue)) {
            throw new Error(`DiagnosticReportId phải có định dạng DIAG-YYYYMM-XXX (e.g., DIAG-202501-001), nhận được: ${trimmedValue}`);
        }
        return new DiagnosticReportId({ value: trimmedValue });
    }
    /**
     * Generate new DiagnosticReportId with current date
     */
    static generate(sequenceNumber) {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const sequence = sequenceNumber.toString().padStart(3, '0');
        const reportId = `DIAG-${year}${month}-${sequence}`;
        return new DiagnosticReportId({ value: reportId });
    }
    validateFormat() {
        if (!DiagnosticReportId.FORMAT_REGEX.test(this.props.value)) {
            throw new Error(`DiagnosticReportId không hợp lệ: ${this.props.value}. Định dạng yêu cầu: DIAG-YYYYMM-XXX`);
        }
        // Validate year and month
        const parts = this.props.value.split('-');
        const yearMonth = parts[1];
        const year = parseInt(yearMonth.substring(0, 4), 10);
        const month = parseInt(yearMonth.substring(4, 6), 10);
        const currentYear = new Date().getFullYear();
        if (year < 2020 || year > currentYear + 1) {
            throw new Error(`Năm không hợp lệ trong DiagnosticReportId: ${year}`);
        }
        if (month < 1 || month > 12) {
            throw new Error(`Tháng không hợp lệ trong DiagnosticReportId: ${month}`);
        }
        // Validate sequence number
        const sequence = parseInt(parts[2], 10);
        if (sequence < 1 || sequence > 999) {
            throw new Error(`Số thứ tự không hợp lệ trong DiagnosticReportId: ${sequence}`);
        }
    }
    /**
     * Get the value as string
     */
    get value() {
        return this.props.value;
    }
    /**
     * Get year from DiagnosticReportId
     */
    getYear() {
        const yearMonth = this.props.value.split('-')[1];
        return parseInt(yearMonth.substring(0, 4), 10);
    }
    /**
     * Get month from DiagnosticReportId
     */
    getMonth() {
        const yearMonth = this.props.value.split('-')[1];
        return parseInt(yearMonth.substring(4, 6), 10);
    }
    /**
     * Get sequence number from DiagnosticReportId
     */
    getSequence() {
        const sequence = this.props.value.split('-')[2];
        return parseInt(sequence, 10);
    }
    /**
     * Check if DiagnosticReportId is from current month
     */
    isCurrentMonth() {
        const now = new Date();
        return this.getYear() === now.getFullYear() && this.getMonth() === now.getMonth() + 1;
    }
    /**
     * Check if DiagnosticReportId is from current year
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
exports.DiagnosticReportId = DiagnosticReportId;
DiagnosticReportId.FORMAT_REGEX = /^DIAG-\d{6}-\d{3}$/;
//# sourceMappingURL=DiagnosticReportId.js.map