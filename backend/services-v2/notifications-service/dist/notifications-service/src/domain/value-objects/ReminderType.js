"use strict";
/**
 * ReminderType Value Object
 * Represents the type/timing of appointment reminder
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderType = void 0;
class ReminderType {
    constructor(value) {
        this.value = value;
    }
    static fromString(value) {
        switch (value) {
            case '24H_BEFORE':
                return ReminderType.TWENTY_FOUR_HOURS;
            case '2H_BEFORE':
                return ReminderType.TWO_HOURS;
            case '30M_BEFORE':
                return ReminderType.THIRTY_MINUTES;
            case 'CUSTOM':
                return ReminderType.CUSTOM;
            default:
                throw new Error(`Invalid reminder type: ${value}`);
        }
    }
    getValue() {
        return this.value;
    }
    toString() {
        return this.value;
    }
    /**
     * Calculate scheduled send time based on reminder type
     */
    calculateSendTime(appointmentDateTime) {
        const sendTime = new Date(appointmentDateTime);
        switch (this.value) {
            case '24H_BEFORE':
                sendTime.setHours(sendTime.getHours() - 24);
                break;
            case '2H_BEFORE':
                sendTime.setHours(sendTime.getHours() - 2);
                break;
            case '30M_BEFORE':
                sendTime.setMinutes(sendTime.getMinutes() - 30);
                break;
            case 'CUSTOM':
                // Custom reminders should have send time explicitly set
                break;
        }
        return sendTime;
    }
    /**
     * Get human-readable description (Vietnamese)
     */
    getDescriptionVi() {
        switch (this.value) {
            case '24H_BEFORE':
                return 'Nhắc nhở trước 24 giờ';
            case '2H_BEFORE':
                return 'Nhắc nhở trước 2 giờ';
            case '30M_BEFORE':
                return 'Nhắc nhở trước 30 phút';
            case 'CUSTOM':
                return 'Nhắc nhở tùy chỉnh';
        }
    }
    /**
     * Get human-readable description (English)
     */
    getDescriptionEn() {
        switch (this.value) {
            case '24H_BEFORE':
                return 'Reminder 24 hours before';
            case '2H_BEFORE':
                return 'Reminder 2 hours before';
            case '30M_BEFORE':
                return 'Reminder 30 minutes before';
            case 'CUSTOM':
                return 'Custom reminder';
        }
    }
    equals(other) {
        return this.value === other.value;
    }
    /**
     * Get all standard reminder types for an appointment
     */
    static getAllStandardTypes() {
        return [
            ReminderType.TWENTY_FOUR_HOURS,
            ReminderType.TWO_HOURS,
            ReminderType.THIRTY_MINUTES,
        ];
    }
}
exports.ReminderType = ReminderType;
ReminderType.TWENTY_FOUR_HOURS = new ReminderType('24H_BEFORE');
ReminderType.TWO_HOURS = new ReminderType('2H_BEFORE');
ReminderType.THIRTY_MINUTES = new ReminderType('30M_BEFORE');
ReminderType.CUSTOM = new ReminderType('CUSTOM');
//# sourceMappingURL=ReminderType.js.map