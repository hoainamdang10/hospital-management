/**
 * Appointment Reminder Repository Interface
 * Port for infrastructure layer implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { AppointmentReminder } from '../aggregates/AppointmentReminder';

export interface IAppointmentReminderRepository {
  /**
   * Save a new reminder or update existing
   */
  save(reminder: AppointmentReminder): Promise<void>;

  /**
   * Find reminder by ID
   */
  findById(id: string): Promise<AppointmentReminder | null>;

  /**
   * Find due reminders (scheduled send time <= current time and status = PENDING)
   */
  findDueReminders(currentTime: Date): Promise<AppointmentReminder[]>;

  /**
   * Find reminders by appointment ID
   */
  findByAppointmentId(appointmentId: string): Promise<AppointmentReminder[]>;

  /**
   * Find failed reminders that can be retried
   */
  findRetriableReminders(): Promise<AppointmentReminder[]>;

  /**
   * Cancel all reminders for an appointment
   */
  cancelByAppointmentId(appointmentId: string, reason: string, cancelledBy: string): Promise<void>;

  /**
   * Delete reminder
   */
  delete(id: string): Promise<void>;
}
