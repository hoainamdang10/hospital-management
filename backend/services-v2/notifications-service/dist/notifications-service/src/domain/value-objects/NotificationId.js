"use strict";
/**
 * NotificationId - Domain Value Object
 * Unique identifier for notifications with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationId = void 0;
class NotificationId {
    constructor(value) {
        this.value = value;
    }
    /**
     * Create new NotificationId with auto-generated format
     * Format: NOT-YYYYMM-XXXXXX
     */
    static create() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const sequence = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
        const id = `NOT-${year}${month}-${sequence}`;
        return new NotificationId(id);
    }
    /**
     * Create NotificationId from existing string
     */
    static fromString(value) {
        if (!value) {
            throw new Error('Mã thông báo không được để trống');
        }
        if (!this.isValidFormat(value)) {
            throw new Error('Mã thông báo không đúng định dạng (NOT-YYYYMM-XXXXXX)');
        }
        return new NotificationId(value);
    }
    /**
     * Validate NotificationId format
     */
    static isValidFormat(value) {
        const pattern = /^NOT-\d{6}-\d{6}$/;
        return pattern.test(value);
    }
    /**
     * Get the string value
     */
    getValue() {
        return this.value;
    }
    /**
     * Extract year and month from ID
     */
    getYearMonth() {
        const parts = this.value.split('-');
        const yearMonth = parts[1];
        const year = parseInt(yearMonth.substring(0, 4));
        const month = parseInt(yearMonth.substring(4, 6));
        return { year, month };
    }
    /**
     * Extract sequence number from ID
     */
    getSequence() {
        const parts = this.value.split('-');
        return parseInt(parts[2]);
    }
    /**
     * Check if this ID is from current month
     */
    isCurrentMonth() {
        const now = new Date();
        const { year, month } = this.getYearMonth();
        return year === now.getFullYear() && month === (now.getMonth() + 1);
    }
    /**
     * Generate display format for Vietnamese UI
     */
    toDisplayFormat() {
        const { year, month } = this.getYearMonth();
        const sequence = this.getSequence();
        const monthNames = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
        return `Thông báo #${sequence} - ${monthNames[month - 1]} ${year}`;
    }
    /**
     * Equality comparison
     */
    equals(other) {
        if (!other)
            return false;
        return this.value === other.value;
    }
    /**
     * String representation
     */
    toString() {
        return this.value;
    }
    /**
     * JSON serialization
     */
    toJSON() {
        return this.value;
    }
    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return NotificationId.fromString(json);
    }
    /**
     * Validate if string can be a valid NotificationId
     */
    static isValid(value) {
        try {
            NotificationId.fromString(value);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Generate next sequence ID for same month
     */
    static generateNext(lastId) {
        const { year, month } = lastId.getYearMonth();
        const lastSequence = lastId.getSequence();
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        // If different month, start from 1
        if (year !== currentYear || month !== currentMonth) {
            return NotificationId.create();
        }
        // Same month, increment sequence
        const nextSequence = String(lastSequence + 1).padStart(6, '0');
        const nextId = `NOT-${year}${String(month).padStart(2, '0')}-${nextSequence}`;
        return new NotificationId(nextId);
    }
    /**
     * Create batch of NotificationIds
     */
    static createBatch(count) {
        const ids = [];
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        for (let i = 0; i < count; i++) {
            const sequence = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
            const id = `NOT-${year}${month}-${sequence}`;
            ids.push(new NotificationId(id));
        }
        return ids;
    }
    /**
     * Parse NotificationId with error handling
     */
    static tryParse(value) {
        try {
            const notificationId = NotificationId.fromString(value);
            return { success: true, notificationId };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Lỗi không xác định khi phân tích mã thông báo'
            };
        }
    }
    /**
     * Get age of notification in days
     */
    getAgeInDays() {
        const { year, month } = this.getYearMonth();
        const notificationDate = new Date(year, month - 1, 1); // First day of the month
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - notificationDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    /**
     * Check if notification is old (older than 30 days)
     */
    isOld() {
        return this.getAgeInDays() > 30;
    }
    /**
     * Generate Vietnamese description
     */
    getVietnameseDescription() {
        const { year, month } = this.getYearMonth();
        const sequence = this.getSequence();
        const age = this.getAgeInDays();
        let description = `Thông báo số ${sequence} được tạo tháng ${month}/${year}`;
        if (age === 0) {
            description += ' (hôm nay)';
        }
        else if (age === 1) {
            description += ' (hôm qua)';
        }
        else if (age < 7) {
            description += ` (${age} ngày trước)`;
        }
        else if (age < 30) {
            const weeks = Math.floor(age / 7);
            description += ` (${weeks} tuần trước)`;
        }
        else {
            const months = Math.floor(age / 30);
            description += ` (${months} tháng trước)`;
        }
        return description;
    }
}
exports.NotificationId = NotificationId;
//# sourceMappingURL=NotificationId.js.map