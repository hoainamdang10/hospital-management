/**
 * NotificationId - Domain Value Object
 * Unique identifier for notifications with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
export declare class NotificationId {
    readonly value: string;
    private constructor();
    /**
     * Create new NotificationId with auto-generated format
     * Format: NOT-YYYYMM-XXXXXX
     */
    static create(): NotificationId;
    /**
     * Create NotificationId from existing string
     */
    static fromString(value: string): NotificationId;
    /**
     * Validate NotificationId format
     */
    private static isValidFormat;
    /**
     * Get the string value
     */
    getValue(): string;
    /**
     * Extract year and month from ID
     */
    getYearMonth(): {
        year: number;
        month: number;
    };
    /**
     * Extract sequence number from ID
     */
    getSequence(): number;
    /**
     * Check if this ID is from current month
     */
    isCurrentMonth(): boolean;
    /**
     * Generate display format for Vietnamese UI
     */
    toDisplayFormat(): string;
    /**
     * Equality comparison
     */
    equals(other: NotificationId): boolean;
    /**
     * String representation
     */
    toString(): string;
    /**
     * JSON serialization
     */
    toJSON(): string;
    /**
     * Create from JSON
     */
    static fromJSON(json: string): NotificationId;
    /**
     * Validate if string can be a valid NotificationId
     */
    static isValid(value: string): boolean;
    /**
     * Generate next sequence ID for same month
     */
    static generateNext(lastId: NotificationId): NotificationId;
    /**
     * Create batch of NotificationIds
     */
    static createBatch(count: number): NotificationId[];
    /**
     * Parse NotificationId with error handling
     */
    static tryParse(value: string): {
        success: boolean;
        notificationId?: NotificationId;
        error?: string;
    };
    /**
     * Get age of notification in days
     */
    getAgeInDays(): number;
    /**
     * Check if notification is old (older than 30 days)
     */
    isOld(): boolean;
    /**
     * Generate Vietnamese description
     */
    getVietnameseDescription(): string;
}
//# sourceMappingURL=NotificationId.d.ts.map