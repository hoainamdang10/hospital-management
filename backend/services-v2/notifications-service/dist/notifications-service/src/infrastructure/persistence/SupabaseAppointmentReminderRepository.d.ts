/**
 * SupabaseAppointmentReminderRepository - Infrastructure Repository Implementation
 * Implements IAppointmentReminderRepository for Supabase
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { Result } from '@shared/core/Result';
import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';
import { AppointmentReminder } from '../../domain/aggregates/AppointmentReminder';
export declare class SupabaseAppointmentReminderRepository implements IAppointmentReminderRepository {
    private readonly supabase;
    private readonly tableName;
    constructor(supabase: SupabaseClient);
    /**
     * Save (create or update) a reminder
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
     * Find due reminders (status = PENDING and scheduled_send_time <= now)
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
     * Mark old reminders as expired (past appointment date)
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