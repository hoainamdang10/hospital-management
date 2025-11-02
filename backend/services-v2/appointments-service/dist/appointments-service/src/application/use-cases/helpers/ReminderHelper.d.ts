/**
 * Reminder Helper - Calculate reminder times
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { AppointmentPriority } from '../../../domain/aggregates/Appointment.aggregate';
export interface ReminderWindow {
    type: '24h' | '2h' | '30min';
    sendAt: Date;
    channels: ('email' | 'sms' | 'push')[];
}
export declare class ReminderHelper {
    /**
     * Calculate reminder windows based on appointment time and priority
     */
    static calculateReminders(appointmentDateTime: Date, priority: AppointmentPriority): ReminderWindow[];
    /**
     * Get reminder policy based on priority
     */
    private static getReminderPolicy;
}
//# sourceMappingURL=ReminderHelper.d.ts.map