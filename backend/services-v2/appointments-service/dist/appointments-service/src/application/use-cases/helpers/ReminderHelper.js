"use strict";
/**
 * Reminder Helper - Calculate reminder times
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderHelper = void 0;
const Appointment_aggregate_1 = require("../../../domain/aggregates/Appointment.aggregate");
class ReminderHelper {
    /**
     * Calculate reminder windows based on appointment time and priority
     */
    static calculateReminders(appointmentDateTime, priority) {
        const policy = this.getReminderPolicy(priority);
        const reminders = [];
        for (const window of policy.windows) {
            const sendAt = new Date(appointmentDateTime);
            // Calculate when to send
            if (window === '24h') {
                sendAt.setHours(sendAt.getHours() - 24);
            }
            else if (window === '2h') {
                sendAt.setHours(sendAt.getHours() - 2);
            }
            else if (window === '30min') {
                sendAt.setMinutes(sendAt.getMinutes() - 30);
            }
            // Only schedule if in future
            if (sendAt > new Date()) {
                reminders.push({
                    type: window,
                    sendAt,
                    channels: policy.channels
                });
            }
        }
        return reminders;
    }
    /**
     * Get reminder policy based on priority
     */
    static getReminderPolicy(priority) {
        switch (priority) {
            case Appointment_aggregate_1.AppointmentPriority.EMERGENCY:
                return {
                    windows: ['30min'],
                    channels: ['sms', 'push']
                };
            case Appointment_aggregate_1.AppointmentPriority.URGENT:
                return {
                    windows: ['2h', '30min'],
                    channels: ['sms', 'push']
                };
            case Appointment_aggregate_1.AppointmentPriority.NORMAL:
            case Appointment_aggregate_1.AppointmentPriority.LOW:
            default:
                return {
                    windows: ['24h', '2h'],
                    channels: ['email', 'push']
                };
        }
    }
}
exports.ReminderHelper = ReminderHelper;
//# sourceMappingURL=ReminderHelper.js.map