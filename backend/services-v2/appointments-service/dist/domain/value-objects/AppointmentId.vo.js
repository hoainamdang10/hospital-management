"use strict";
/**
 * AppointmentId Value Object - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 * Format: XXXX-APT-XXXXXX-XXX (matches database appointment_id column)
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentId = void 0;
const value_object_1 = require("../../shared/domain/base/value-object");
/**
 * AppointmentId Value Object
 * Unique identifier for appointments
 * Format: XXXX-APT-XXXXXX-XXX
 * Example: 2025-APT-010001-001
 */
class AppointmentId extends value_object_1.HealthcareValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Create AppointmentId from string
     */
    static create(value) {
        if (!AppointmentId.isValid(value)) {
            throw new Error(`Invalid appointment ID format: ${value}. Expected format: XXXX-APT-XXXXXX-XXX`);
        }
        return new AppointmentId({ value: value.toUpperCase() });
    }
    /**
     * Generate new AppointmentId
     * Format: YYYY-APT-MMDDSS-NNN
     * YYYY: Year
     * MM: Month
     * DD: Day
     * SS: Second (for uniqueness)
     * NNN: Random 3-digit number
     */
    static generate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        const value = `${year}-APT-${month}${day}${second}-${random}`;
        return new AppointmentId({ value });
    }
    /**
     * Validate appointment ID format
     */
    static isValid(value) {
        // Format: XXXX-APT-XXXXXX-XXX
        const regex = /^\d{4}-APT-\d{6}-\d{3}$/;
        return regex.test(value);
    }
    /**
     * Get appointment ID value
     */
    get value() {
        return this.props.value;
    }
    /**
     * Extract year from appointment ID
     */
    get year() {
        return parseInt(this.props.value.substring(0, 4));
    }
    /**
     * Extract month from appointment ID
     */
    get month() {
        return parseInt(this.props.value.substring(8, 10));
    }
    /**
     * Extract day from appointment ID
     */
    get day() {
        return parseInt(this.props.value.substring(10, 12));
    }
    /**
     * Healthcare-specific: Contains PHI
     */
    containsPHI() {
        return false; // Appointment ID itself doesn't contain PHI
    }
    /**
     * Anonymize for logging
     */
    anonymize() {
        return this; // Appointment ID is already anonymized
    }
    /**
     * String representation
     */
    toString() {
        return this.props.value;
    }
}
exports.AppointmentId = AppointmentId;
//# sourceMappingURL=AppointmentId.vo.js.map