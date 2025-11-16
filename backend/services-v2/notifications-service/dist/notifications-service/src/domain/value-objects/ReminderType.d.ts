/**
 * ReminderType Value Object
 * Represents the type/timing of appointment reminder
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
export type ReminderTypeValue = '24H_BEFORE' | '2H_BEFORE' | '30M_BEFORE' | 'CUSTOM';
export declare class ReminderType {
    private readonly value;
    private constructor();
    static readonly TWENTY_FOUR_HOURS: ReminderType;
    static readonly TWO_HOURS: ReminderType;
    static readonly THIRTY_MINUTES: ReminderType;
    static readonly CUSTOM: ReminderType;
    static fromString(value: string): ReminderType;
    getValue(): ReminderTypeValue;
    toString(): string;
    /**
     * Calculate scheduled send time based on reminder type
     */
    calculateSendTime(appointmentDateTime: Date): Date;
    /**
     * Get human-readable description (Vietnamese)
     */
    getDescriptionVi(): string;
    /**
     * Get human-readable description (English)
     */
    getDescriptionEn(): string;
    equals(other: ReminderType): boolean;
    /**
     * Get all standard reminder types for an appointment
     */
    static getAllStandardTypes(): ReminderType[];
}
//# sourceMappingURL=ReminderType.d.ts.map