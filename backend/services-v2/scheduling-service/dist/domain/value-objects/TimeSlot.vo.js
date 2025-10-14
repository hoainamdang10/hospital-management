"use strict";
/**
 * TimeSlot Value Object - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 * Matches database: appointment_date (date) + appointment_time (time)
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSlot = void 0;
const value_object_1 = require("@shared/domain/base/value-object");
/**
 * TimeSlot Value Object
 * Represents appointment date and time
 */
class TimeSlot extends value_object_1.HealthcareValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Create TimeSlot from date and time strings
     */
    static create(appointmentDate, appointmentTime) {
        TimeSlot.validateDate(appointmentDate);
        TimeSlot.validateTime(appointmentTime);
        return new TimeSlot({
            appointmentDate,
            appointmentTime
        });
    }
    /**
     * Create TimeSlot from Date object
     */
    static fromDate(date) {
        const appointmentDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const appointmentTime = date.toTimeString().split(' ')[0]; // HH:MM:SS
        return new TimeSlot({
            appointmentDate,
            appointmentTime
        });
    }
    /**
     * Validate date format (YYYY-MM-DD)
     */
    static validateDate(date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new Error(`Invalid date format: ${date}. Expected format: YYYY-MM-DD`);
        }
        // Validate date is valid
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid date: ${date}`);
        }
    }
    /**
     * Validate time format (HH:MM:SS)
     */
    static validateTime(time) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
        if (!timeRegex.test(time)) {
            throw new Error(`Invalid time format: ${time}. Expected format: HH:MM:SS`);
        }
    }
    /**
     * Get appointment date
     */
    get appointmentDate() {
        return this.props.appointmentDate;
    }
    /**
     * Get appointment time
     */
    get appointmentTime() {
        return this.props.appointmentTime;
    }
    /**
     * Convert to Date object
     */
    toDate() {
        return new Date(`${this.props.appointmentDate}T${this.props.appointmentTime}`);
    }
    /**
     * Check if time slot is in the past
     */
    isPast() {
        return this.toDate() < new Date();
    }
    /**
     * Check if time slot is in the future
     */
    isFuture() {
        return this.toDate() > new Date();
    }
    /**
     * Check if time slot is today
     */
    isToday() {
        const today = new Date().toISOString().split('T')[0];
        return this.props.appointmentDate === today;
    }
    /**
     * Get time slot as ISO string
     */
    toISOString() {
        return this.toDate().toISOString();
    }
    /**
     * Get formatted date (Vietnamese format: DD/MM/YYYY)
     */
    getFormattedDate() {
        const [year, month, day] = this.props.appointmentDate.split('-');
        return `${day}/${month}/${year}`;
    }
    /**
     * Get formatted time (HH:MM)
     */
    getFormattedTime() {
        return this.props.appointmentTime.substring(0, 5); // HH:MM
    }
    /**
     * Get day of week (Vietnamese)
     */
    getDayOfWeek() {
        const date = this.toDate();
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return days[date.getDay()];
    }
    /**
     * Check if time slot conflicts with another time slot
     */
    conflictsWith(other, durationMinutes, otherDurationMinutes) {
        // Different dates = no conflict
        if (this.props.appointmentDate !== other.props.appointmentDate) {
            return false;
        }
        // Calculate end times
        const thisStart = this.toDate();
        const thisEnd = new Date(thisStart.getTime() + durationMinutes * 60000);
        const otherStart = other.toDate();
        const otherEnd = new Date(otherStart.getTime() + otherDurationMinutes * 60000);
        // Check overlap
        return (thisStart < otherEnd && thisEnd > otherStart);
    }
    /**
     * Add minutes to time slot
     */
    addMinutes(minutes) {
        const date = this.toDate();
        date.setMinutes(date.getMinutes() + minutes);
        return TimeSlot.fromDate(date);
    }
    /**
     * Healthcare-specific: Contains PHI
     */
    containsPHI() {
        return false; // Time slot itself doesn't contain PHI
    }
    /**
     * Anonymize for logging
     */
    anonymize() {
        return this; // Time slot is already anonymized
    }
    /**
     * String representation
     */
    toString() {
        return `${this.getFormattedDate()} ${this.getFormattedTime()}`;
    }
}
exports.TimeSlot = TimeSlot;
//# sourceMappingURL=TimeSlot.vo.js.map