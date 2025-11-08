/**
 * IAppointmentReminderRepository - Domain Repository Interface
 * Defines contract for MANUAL reminder persistence (Alternative approach)
 *
 * ⚠️ NOTE: This is for manual reminders only, not auto-generated reminders
 *
 * Auto-generated reminders are managed by Scheduler Service and stored in
 * scheduler.schedules table. This repository is for manual reminder management.
 *
 * @see AppointmentScheduledSchedulerHandler for auto-scheduling
 * @see RemoteSchedulerAdapter for Scheduler Service integration
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD
 */
import { AppointmentReminder, ReminderStatus } from '../entities/AppointmentReminder.entity';
export interface IAppointmentReminderRepository {
    /**
     * Save a new reminder
     */
    save(reminder: AppointmentReminder): Promise<void>;
    /**
     * Update an existing reminder
     */
    update(reminder: AppointmentReminder): Promise<void>;
    /**
     * Find reminder by ID
     */
    findById(reminderId: string): Promise<AppointmentReminder | null>;
    /**
     * Find all reminders for an appointment
     */
    findByAppointmentId(appointmentId: string): Promise<AppointmentReminder[]>;
    /**
     * Find pending reminders that should be sent
     */
    findPendingReminders(beforeTime: Date): Promise<AppointmentReminder[]>;
    /**
     * Find reminders by status
     */
    findByStatus(status: ReminderStatus, limit?: number): Promise<AppointmentReminder[]>;
    /**
     * Delete a reminder
     */
    delete(reminderId: string): Promise<void>;
    /**
     * Delete all reminders for an appointment
     */
    deleteByAppointmentId(appointmentId: string): Promise<void>;
    /**
     * Count reminders for an appointment
     */
    countByAppointmentId(appointmentId: string): Promise<number>;
}
//# sourceMappingURL=IAppointmentReminderRepository.d.ts.map