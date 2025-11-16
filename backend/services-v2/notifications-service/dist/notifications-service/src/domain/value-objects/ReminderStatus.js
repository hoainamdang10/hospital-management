"use strict";
/**
 * ReminderStatus Value Object
 * Represents the current status of a reminder
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderStatus = void 0;
class ReminderStatus {
    constructor(value) {
        this.value = value;
    }
    static fromString(value) {
        switch (value) {
            case 'PENDING':
                return ReminderStatus.PENDING;
            case 'PROCESSING':
                return ReminderStatus.PROCESSING;
            case 'SENT':
                return ReminderStatus.SENT;
            case 'FAILED':
                return ReminderStatus.FAILED;
            case 'CANCELLED':
                return ReminderStatus.CANCELLED;
            case 'EXPIRED':
                return ReminderStatus.EXPIRED;
            default:
                throw new Error(`Invalid reminder status: ${value}`);
        }
    }
    getValue() {
        return this.value;
    }
    toString() {
        return this.value;
    }
    isPending() {
        return this.value === 'PENDING';
    }
    isProcessing() {
        return this.value === 'PROCESSING';
    }
    isSent() {
        return this.value === 'SENT';
    }
    isFailed() {
        return this.value === 'FAILED';
    }
    isCancelled() {
        return this.value === 'CANCELLED';
    }
    isExpired() {
        return this.value === 'EXPIRED';
    }
    isFinal() {
        return this.isSent() || this.isCancelled() || this.isExpired();
    }
    canRetry() {
        return this.isFailed();
    }
    canCancel() {
        return this.isPending() || this.isFailed();
    }
    equals(other) {
        return this.value === other.value;
    }
}
exports.ReminderStatus = ReminderStatus;
ReminderStatus.PENDING = new ReminderStatus('PENDING');
ReminderStatus.PROCESSING = new ReminderStatus('PROCESSING');
ReminderStatus.SENT = new ReminderStatus('SENT');
ReminderStatus.FAILED = new ReminderStatus('FAILED');
ReminderStatus.CANCELLED = new ReminderStatus('CANCELLED');
ReminderStatus.EXPIRED = new ReminderStatus('EXPIRED');
//# sourceMappingURL=ReminderStatus.js.map