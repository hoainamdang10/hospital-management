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
export interface WorkingHours {
    start: string;
    end: string;
}
export interface ProviderScheduleProps {
    providerId: string;
    workingDays: string[];
    workingHours: WorkingHours | WorkingHours[];
    timeZone: string;
    isFlexible: boolean;
    effectiveDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * ProviderSchedule Value Object
 * Represents a cached work schedule template for a provider
 */
export declare class ProviderSchedule {
    private readonly props;
    private constructor();
    /**
     * Create new ProviderSchedule
     */
    static create(props: Omit<ProviderScheduleProps, 'createdAt' | 'updatedAt'>): ProviderSchedule;
    /**
     * Reconstitute from persistence
     */
    static fromPersistence(data: any): ProviderSchedule;
    /**
     * Validate schedule
     */
    private validate;
    get providerId(): string;
    get workingDays(): string[];
    get workingHours(): WorkingHours | WorkingHours[];
    /**
     * Get all working hour ranges as an array (normalized)
     */
    getWorkingHourRanges(): WorkingHours[];
    get timeZone(): string;
    get isFlexible(): boolean;
    get effectiveDate(): Date | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    /**
     * Check if provider works on a specific day
     */
    isWorkingDay(day: string): boolean;
    /**
     * Check if a time is within working hours (any time range)
     */
    isWorkingTime(time: string): boolean;
    /**
     * Get working hours per day (sum of all time ranges)
     */
    getWorkingHoursPerDay(): number;
    /**
     * Get working hours per week
     */
    getWorkingHoursPerWeek(): number;
    /**
     * Check if schedule is full-time (40+ hours/week)
     */
    isFullTime(): boolean;
    /**
     * Check if schedule includes weekend work
     */
    hasWeekendWork(): boolean;
    /**
     * Update schedule (returns new instance - immutable)
     */
    update(updates: Partial<Omit<ProviderScheduleProps, 'providerId' | 'createdAt' | 'updatedAt'>>): ProviderSchedule;
    /**
     * Convert to persistence format
     */
    toPersistence(): any;
    private isValidTimeRange;
    private parseTime;
    /**
     * Equality check
     */
    equals(other: ProviderSchedule): boolean;
    /**
     * String representation
     */
    toString(): string;
}
//# sourceMappingURL=ProviderSchedule.vo.d.ts.map