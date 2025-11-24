/**
 * TimeSlot Value Object - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 * Matches database: appointment_date (date) + appointment_time (time)
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { HealthcareValueObject } from '../../../../shared/domain/base/value-object';
export interface TimeSlotProps {
    appointmentDate: string;
    appointmentTime: string;
    startAtUtc?: Date;
    endAtUtc?: Date;
}
/**
 * TimeSlot Value Object
 * Represents appointment date and time
 */
export declare class TimeSlot extends HealthcareValueObject<TimeSlotProps> {
    private constructor();
    /**
     * Create TimeSlot from date and time strings (legacy)
     */
    static create(appointmentDate: string, appointmentTime: string): TimeSlot;
    /**
     * Create TimeSlot with timezone-aware timestamps (new)
     */
    static createWithTimestamps(appointmentDate: string, appointmentTime: string, startAtUtc: Date, endAtUtc: Date): TimeSlot;
    /**
     * Create TimeSlot from UTC timestamps only
     */
    static fromUtcTimestamps(startAtUtc: Date, endAtUtc: Date): TimeSlot;
    /**
     * Create TimeSlot from Date object
     */
    static fromDate(date: Date): TimeSlot;
    /**
     * Validate value object format (required by ValueObject base class)
     */
    protected validateFormat(): void;
    /**
     * Validate date format (YYYY-MM-DD)
     */
    private static validateDate;
    /**
     * Validate time format (HH:MM:SS)
     */
    private static validateTime;
    /**
     * Get appointment date
     */
    get appointmentDate(): string;
    /**
     * Get appointment time
     */
    get appointmentTime(): string;
    /**
     * Get start time (UTC)
     */
    get startAtUtc(): Date | undefined;
    /**
     * Get end time (UTC)
     */
    get endAtUtc(): Date | undefined;
    /**
     * Convert to Date object (legacy - uses local time)
     */
    toDate(): Date;
    /**
     * Get start time as Date (prefers UTC, falls back to legacy)
     */
    getStartTime(): Date;
    /**
     * Get end time as Date (requires UTC or duration calculation)
     */
    getEndTime(durationMinutes?: number): Date;
    /**
     * Check if time slot is in the past
     */
    isPast(): boolean;
    /**
     * Check if time slot is in the future
     */
    isFuture(): boolean;
    /**
     * Check if time slot is today
     */
    isToday(): boolean;
    /**
     * Get time slot as ISO string
     */
    toISOString(): string;
    /**
     * Get formatted date (Vietnamese format: DD/MM/YYYY)
     */
    getFormattedDate(): string;
    /**
     * Get formatted time (HH:MM)
     */
    getFormattedTime(): string;
    /**
     * Get day of week (Vietnamese)
     */
    getDayOfWeek(): string;
    /**
     * Check if time slot conflicts with another time slot
     */
    conflictsWith(other: TimeSlot, durationMinutes: number, otherDurationMinutes: number): boolean;
    /**
     * Add minutes to time slot
     */
    addMinutes(minutes: number): TimeSlot;
    /**
     * Healthcare-specific: Contains PHI
     */
    containsPHI(): boolean;
    /**
     * Anonymize for logging
     */
    anonymize(): TimeSlot;
    /**
     * String representation
     */
    toString(): string;
}
//# sourceMappingURL=TimeSlot.vo.d.ts.map