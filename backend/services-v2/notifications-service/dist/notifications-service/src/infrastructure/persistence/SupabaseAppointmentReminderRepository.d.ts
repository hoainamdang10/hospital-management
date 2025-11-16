/**
 * SupabaseAppointmentReminderRepository - Infrastructure Repository Implementation
 * Implements IAppointmentReminderRepository for Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';
import { AppointmentReminder } from '../../domain/aggregates/AppointmentReminder';
export declare class SupabaseAppointmentReminderRepository implements IAppointmentReminderRepository {
    private readonly supabase;
    private readonly tableName;
    constructor(supabase: SupabaseClient);
    /**
     * Save (create or update) a reminder
     */
    save(reminder: AppointmentReminder): Promise<void>;
    /**
     * Find reminder by ID
     */
    findById(reminderId: string): Promise<AppointmentReminder | null>;
    /**
     * Find reminders by appointment ID
     */
    findByAppointmentId(appointmentId: string): Promise<AppointmentReminder[]>;
    /**
     * Find due reminders (status = PENDING and scheduled_send_time <= now)
     */
    findDueReminders(currentTime: Date): Promise<AppointmentReminder[]>;
    /**
     * Find failed reminders that can be retried
     */
    findRetriableReminders(): Promise<AppointmentReminder[]>;
    /**
     * Cancel all reminders for an appointment
     */
    cancelByAppointmentId(appointmentId: string, reason: string, cancelledBy: string): Promise<void>;
    /**
     * Delete reminder by ID
     */
    delete(reminderId: string): Promise<void>;
    /**
     * Map domain aggregate to database record
     */
    private mapToRecord;
    /**
     * Map database record to domain aggregate
     */
    private mapToDomain;
}
//# sourceMappingURL=SupabaseAppointmentReminderRepository.d.ts.map