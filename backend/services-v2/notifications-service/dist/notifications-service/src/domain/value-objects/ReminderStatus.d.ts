/**
 * ReminderStatus Value Object
 * Represents the current status of a reminder
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
export type ReminderStatusValue = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
export declare class ReminderStatus {
    private readonly value;
    private constructor();
    static readonly PENDING: ReminderStatus;
    static readonly PROCESSING: ReminderStatus;
    static readonly SENT: ReminderStatus;
    static readonly FAILED: ReminderStatus;
    static readonly CANCELLED: ReminderStatus;
    static readonly EXPIRED: ReminderStatus;
    static fromString(value: string): ReminderStatus;
    getValue(): ReminderStatusValue;
    toString(): string;
    isPending(): boolean;
    isProcessing(): boolean;
    isSent(): boolean;
    isFailed(): boolean;
    isCancelled(): boolean;
    isExpired(): boolean;
    isFinal(): boolean;
    canRetry(): boolean;
    canCancel(): boolean;
    equals(other: ReminderStatus): boolean;
}
//# sourceMappingURL=ReminderStatus.d.ts.map