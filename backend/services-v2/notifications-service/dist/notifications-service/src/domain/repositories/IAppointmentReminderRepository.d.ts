/**
 * IAppointmentReminderRepository Interface
 * Repository contract for appointment reminders
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { AppointmentReminder } from '../aggregates/AppointmentReminder';
import { Result } from '@shared/core/Result';
export interface IAppointmentReminderRepository {
    /**
     * Save a reminder (create or update)
     */
    save(reminder: AppointmentReminder): Promise<Result<void>>;
    /**
     * Find reminder by ID
     */
    findById(reminderId: string): Promise<Result<AppointmentReminder | null>>;
    /**
     * Find reminders by appointment ID
     */
    findByAppointmentId(appointmentId: string): Promise<Result<AppointmentReminder[]>>;
    /**
     * Find due reminders (pending and scheduled_send_time <= now)
     */
    findDueReminders(limit?: number): Promise<Result<AppointmentReminder[]>>;
    /**
     * Find failed reminders that can be retried
     */
    findRetryableReminders(limit?: number): Promise<Result<AppointmentReminder[]>>;
    /**
     * Find reminders by patient ID
     */
    findByPatientId(patientId: string): Promise<Result<AppointmentReminder[]>>;
    /**
     * Cancel all reminders for an appointment
     */
    cancelByAppointmentId(appointmentId: string, reason: string, cancelledBy: string): Promise<Result<number>>;
    /**
     * Mark old reminders as expired
     */
    expireOldReminders(): Promise<Result<number>>;
    /**
     * Delete reminder by ID
     */
    delete(reminderId: string): Promise<Result<void>>;
    /**
     * Count pending reminders
     */
    countPending(): Promise<Result<number>>;
    /**
     * Count reminders by status
     */
    countByStatus(status: string): Promise<Result<number>>;
}
//# sourceMappingURL=IAppointmentReminderRepository.d.ts.map