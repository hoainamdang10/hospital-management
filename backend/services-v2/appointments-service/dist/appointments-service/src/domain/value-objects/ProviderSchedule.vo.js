"use strict";
/**
 * ProviderSchedule Value Object
 * Cached work schedule template from Provider Staff Service
 *
 * Bounded Context: Appointments Service
 * - Owns runtime availability calculation
 * - Caches work schedule templates via StaffScheduleUpdatedEvent
 * - Provider Staff Service owns the source of truth for work schedules
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Bounded Context Separation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderSchedule = void 0;
/**
 * ProviderSchedule Value Object
 * Represents a cached work schedule template for a provider
 */
class ProviderSchedule {
    constructor(props) {
        this.props = props;
        this.validate();
    }
    /**
     * Create new ProviderSchedule
     */
    static create(props) {
        const now = new Date();
        return new ProviderSchedule({
            ...props,
            createdAt: now,
            updatedAt: now
        });
    }
    /**
     * Reconstitute from persistence
     */
    static fromPersistence(data) {
        // Normalize working_hours: convert array to array, keep object as-is
        let workingHours = data.working_hours;
        // If working_hours is an array of time ranges, keep it as array
        // If it's a single object, keep it as object
        if (Array.isArray(data.working_hours)) {
            workingHours = data.working_hours;
        }
        else {
            workingHours = data.working_hours;
        }
        return new ProviderSchedule({
            providerId: data.provider_id,
            workingDays: data.working_days,
            workingHours: workingHours,
            timeZone: data.time_zone,
            isFlexible: data.is_flexible,
            effectiveDate: data.effective_date ? new Date(data.effective_date) : undefined,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        });
    }
    /**
     * Validate schedule
     */
    validate() {
        if (!this.props.providerId || this.props.providerId.trim().length === 0) {
            throw new Error('Provider ID không được để trống');
        }
        if (!this.props.workingDays || this.props.workingDays.length === 0) {
            throw new Error('Ngày làm việc không được để trống');
        }
        if (!this.props.workingHours) {
            throw new Error('Giờ làm việc không được để trống');
        }
        if (!this.props.timeZone || this.props.timeZone.trim().length === 0) {
            throw new Error('Múi giờ không được để trống');
        }
    }
    // Getters
    get providerId() {
        return this.props.providerId;
    }
    get workingDays() {
        return [...this.props.workingDays];
    }
    get workingHours() {
        if (Array.isArray(this.props.workingHours)) {
            return [...this.props.workingHours];
        }
        return { ...this.props.workingHours };
    }
    /**
     * Get all working hour ranges as an array (normalized)
     */
    getWorkingHourRanges() {
        if (Array.isArray(this.props.workingHours)) {
            return this.props.workingHours;
        }
        return [this.props.workingHours];
    }
    get timeZone() {
        return this.props.timeZone;
    }
    get isFlexible() {
        return this.props.isFlexible;
    }
    get effectiveDate() {
        return this.props.effectiveDate;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    /**
     * Check if provider works on a specific day
     * Supports both lowercase ('monday') and uppercase ('MONDAY') formats
     */
    isWorkingDay(day) {
        const dayLower = day.toLowerCase();
        const dayUpper = day.toUpperCase();
        return this.props.workingDays.some(d => d.toLowerCase() === dayLower || d.toUpperCase() === dayUpper);
    }
    /**
     * Check if a time is within working hours (any time range)
     */
    isWorkingTime(time) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(time)) {
            return false;
        }
        // Check if time falls within any of the working hour ranges
        const ranges = this.getWorkingHourRanges();
        return ranges.some(range => this.isValidTimeRange(range.start, time) &&
            this.isValidTimeRange(time, range.end));
    }
    /**
     * Get working hours per day (sum of all time ranges)
     */
    getWorkingHoursPerDay() {
        const ranges = this.getWorkingHourRanges();
        return ranges.reduce((total, range) => {
            const start = this.parseTime(range.start);
            const end = this.parseTime(range.end);
            return total + (end.hours - start.hours) + (end.minutes - start.minutes) / 60;
        }, 0);
    }
    /**
     * Get working hours per week
     */
    getWorkingHoursPerWeek() {
        return this.getWorkingHoursPerDay() * this.props.workingDays.length;
    }
    /**
     * Check if schedule is full-time (40+ hours/week)
     */
    isFullTime() {
        return this.getWorkingHoursPerWeek() >= 40;
    }
    /**
     * Check if schedule includes weekend work
     */
    hasWeekendWork() {
        return this.isWorkingDay('saturday') || this.isWorkingDay('sunday');
    }
    /**
     * Update schedule (returns new instance - immutable)
     */
    update(updates) {
        return new ProviderSchedule({
            ...this.props,
            ...updates,
            updatedAt: new Date()
        });
    }
    /**
     * Convert to persistence format
     */
    toPersistence() {
        return {
            provider_id: this.props.providerId,
            working_days: this.props.workingDays,
            working_hours: this.props.workingHours,
            time_zone: this.props.timeZone,
            is_flexible: this.props.isFlexible,
            effective_date: this.props.effectiveDate?.toISOString(),
            created_at: this.props.createdAt.toISOString(),
            updated_at: this.props.updatedAt.toISOString()
        };
    }
    // Helper methods
    isValidTimeRange(startTime, endTime) {
        const start = this.parseTime(startTime);
        const end = this.parseTime(endTime);
        if (start.hours > end.hours) {
            return false;
        }
        if (start.hours === end.hours && start.minutes >= end.minutes) {
            return false;
        }
        return true;
    }
    parseTime(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return { hours, minutes };
    }
    /**
     * Equality check
     */
    equals(other) {
        if (!other)
            return false;
        return this.props.providerId === other.props.providerId &&
            JSON.stringify(this.props.workingDays) === JSON.stringify(other.props.workingDays) &&
            JSON.stringify(this.props.workingHours) === JSON.stringify(other.props.workingHours) &&
            this.props.timeZone === other.props.timeZone &&
            this.props.isFlexible === other.props.isFlexible;
    }
    /**
     * String representation
     */
    toString() {
        const days = this.props.workingDays.join(', ');
        const ranges = this.getWorkingHourRanges();
        const hours = ranges.map(r => `${r.start}-${r.end}`).join(', ');
        return `Provider ${this.props.providerId}: ${days} | ${hours} (${this.getWorkingHoursPerWeek()}h/week)`;
    }
}
exports.ProviderSchedule = ProviderSchedule;
//# sourceMappingURL=ProviderSchedule.vo.js.map