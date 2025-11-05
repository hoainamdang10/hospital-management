"use strict";
/**
 * InvoiceId Value Object - Domain Layer
 * Represents a unique identifier for invoices in Vietnamese healthcare system
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Invoice Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceId = void 0;
const ValueObject_1 = require("../../../../shared/domain/ValueObject");
/**
 * InvoiceId Value Object
 * Format: INV-YYYYMM-XXXXXX (e.g., INV-202412-000001)
 * - INV: Invoice prefix
 * - YYYYMM: Year and month
 * - XXXXXX: Sequential number (6 digits)
 */
class InvoiceId extends ValueObject_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Create InvoiceId from string
     */
    static create(value) {
        if (!value) {
            throw new Error("Invoice ID không được để trống");
        }
        if (!this.isValidFormat(value)) {
            throw new Error("Invoice ID không đúng định dạng. Định dạng hợp lệ: INV-YYYYMM-XXXXXX");
        }
        return new InvoiceId({ value: value.toUpperCase() });
    }
    /**
     * Generate new InvoiceId
     */
    static generate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const sequence = this.generateSequenceNumber();
        const value = `INV-${year}${month}-${sequence}`;
        return new InvoiceId({ value });
    }
    /**
     * Generate InvoiceId for specific month
     */
    static generateForMonth(year, month, sequence) {
        const monthStr = String(month).padStart(2, "0");
        const sequenceStr = String(sequence).padStart(6, "0");
        const value = `INV-${year}${monthStr}-${sequenceStr}`;
        return new InvoiceId({ value });
    }
    /**
     * Create InvoiceId from components
     */
    static fromComponents(year, month, sequence) {
        return this.generateForMonth(year, month, sequence);
    }
    /**
     * Get the string value
     */
    get value() {
        return this.props.value;
    }
    /**
     * Get year from invoice ID
     */
    get year() {
        const parts = this.props.value.split("-");
        return parseInt(parts[1].substring(0, 4));
    }
    /**
     * Get month from invoice ID
     */
    get month() {
        const parts = this.props.value.split("-");
        return parseInt(parts[1].substring(4, 6));
    }
    /**
     * Get sequence number from invoice ID
     */
    get sequence() {
        const parts = this.props.value.split("-");
        return parseInt(parts[2]);
    }
    /**
     * Get year-month string (YYYYMM)
     */
    get yearMonth() {
        const parts = this.props.value.split("-");
        return parts[1];
    }
    /**
     * Get formatted display string
     */
    get displayValue() {
        return this.props.value;
    }
    /**
     * Get Vietnamese formatted display
     */
    get vietnameseDisplay() {
        return `Hóa đơn số ${this.props.value}`;
    }
    /**
     * Check if invoice is from current month
     */
    isCurrentMonth() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        return this.year === currentYear && this.month === currentMonth;
    }
    /**
     * Check if invoice is from current year
     */
    isCurrentYear() {
        const currentYear = new Date().getFullYear();
        return this.year === currentYear;
    }
    /**
     * Get age in days
     */
    getAgeInDays() {
        const invoiceDate = new Date(this.year, this.month - 1, 1);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - invoiceDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    /**
     * Check if invoice is overdue (older than 30 days)
     */
    isOverdue() {
        return this.getAgeInDays() > 30;
    }
    /**
     * Get next invoice ID in sequence
     */
    getNext() {
        return InvoiceId.generateForMonth(this.year, this.month, this.sequence + 1);
    }
    /**
     * Get previous invoice ID in sequence
     */
    getPrevious() {
        if (this.sequence <= 1) {
            throw new Error("Không thể tạo invoice ID trước đó cho sequence đầu tiên");
        }
        return InvoiceId.generateForMonth(this.year, this.month, this.sequence - 1);
    }
    /**
     * Compare with another InvoiceId
     */
    compareTo(other) {
        if (this.year !== other.year) {
            return this.year - other.year;
        }
        if (this.month !== other.month) {
            return this.month - other.month;
        }
        return this.sequence - other.sequence;
    }
    /**
     * Check if this invoice is newer than another
     */
    isNewerThan(other) {
        return this.compareTo(other) > 0;
    }
    /**
     * Check if this invoice is older than another
     */
    isOlderThan(other) {
        return this.compareTo(other) < 0;
    }
    /**
     * Validate invoice ID format
     */
    static isValidFormat(value) {
        // Format: INV-YYYYMM-XXXXXX
        const pattern = /^INV-\d{6}-\d{6}$/;
        if (!pattern.test(value)) {
            return false;
        }
        const parts = value.split("-");
        const yearMonth = parts[1];
        const sequence = parts[2];
        // Validate year (2020-2099)
        const year = parseInt(yearMonth.substring(0, 4));
        if (year < 2020 || year > 2099) {
            return false;
        }
        // Validate month (01-12)
        const month = parseInt(yearMonth.substring(4, 6));
        if (month < 1 || month > 12) {
            return false;
        }
        // Validate sequence (000001-999999)
        const sequenceNum = parseInt(sequence);
        if (sequenceNum < 1 || sequenceNum > 999999) {
            return false;
        }
        return true;
    }
    /**
     * Generate sequence number (simulated - in real implementation would come from database)
     */
    static generateSequenceNumber() {
        // In real implementation, this would query the database for the next sequence number
        // For now, generate a random number for testing
        const sequence = Math.floor(Math.random() * 999999) + 1;
        return String(sequence).padStart(6, "0");
    }
    /**
     * Parse invoice ID components
     */
    static parseComponents(value) {
        if (!this.isValidFormat(value)) {
            throw new Error("Invoice ID không đúng định dạng");
        }
        const parts = value.split("-");
        const yearMonth = parts[1];
        return {
            prefix: parts[0],
            year: parseInt(yearMonth.substring(0, 4)),
            month: parseInt(yearMonth.substring(4, 6)),
            sequence: parseInt(parts[2]),
            yearMonth: yearMonth,
        };
    }
    /**
     * Create range of invoice IDs
     */
    static createRange(start, end) {
        const range = [];
        let current = start;
        while (current.compareTo(end) <= 0) {
            range.push(current);
            // Move to next invoice
            if (current.sequence < 999999) {
                current = InvoiceId.generateForMonth(current.year, current.month, current.sequence + 1);
            }
            else {
                // Move to next month
                let nextMonth = current.month + 1;
                let nextYear = current.year;
                if (nextMonth > 12) {
                    nextMonth = 1;
                    nextYear++;
                }
                current = InvoiceId.generateForMonth(nextYear, nextMonth, 1);
            }
            // Safety check to prevent infinite loop
            if (range.length > 1000000) {
                throw new Error("Range quá lớn, không thể tạo");
            }
        }
        return range;
    }
    /**
     * Get invoice IDs for specific month
     */
    static getMonthRange(year, month, startSequence = 1, endSequence = 999999) {
        const start = InvoiceId.generateForMonth(year, month, startSequence);
        const end = InvoiceId.generateForMonth(year, month, endSequence);
        return this.createRange(start, end);
    }
    /**
     * Validate Vietnamese invoice number standards
     */
    isVietnameseCompliant() {
        // Vietnamese invoice standards validation
        return (this.sequence >= 1 &&
            this.sequence <= 999999 &&
            this.year >= 2020 &&
            this.month >= 1 &&
            this.month <= 12);
    }
    /**
     * Get tax period (quarter) for Vietnamese tax reporting
     */
    getTaxQuarter() {
        if (this.month <= 3)
            return 1;
        if (this.month <= 6)
            return 2;
        if (this.month <= 9)
            return 3;
        return 4;
    }
    /**
     * Get Vietnamese tax period display
     */
    getVietnameseTaxPeriod() {
        const quarter = this.getTaxQuarter();
        return `Quý ${quarter}/${this.year}`;
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            value: this.props.value,
            year: this.year,
            month: this.month,
            sequence: this.sequence,
            yearMonth: this.yearMonth,
            displayValue: this.displayValue,
            vietnameseDisplay: this.vietnameseDisplay,
            isCurrentMonth: this.isCurrentMonth(),
            isCurrentYear: this.isCurrentYear(),
            ageInDays: this.getAgeInDays(),
            isOverdue: this.isOverdue(),
            taxQuarter: this.getTaxQuarter(),
            vietnameseTaxPeriod: this.getVietnameseTaxPeriod(),
            vietnameseCompliant: this.isVietnameseCompliant(),
        };
    }
    /**
     * String representation
     */
    toString() {
        return this.props.value;
    }
}
exports.InvoiceId = InvoiceId;
//# sourceMappingURL=InvoiceId.js.map