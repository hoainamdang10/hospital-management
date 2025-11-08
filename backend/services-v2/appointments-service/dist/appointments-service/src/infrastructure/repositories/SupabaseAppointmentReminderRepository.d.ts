/**
 * SupabaseAppointmentReminderRepository - Infrastructure Layer
 * Implements MANUAL reminder persistence using Supabase (Alternative approach)
 *
 * ⚠️ IMPORTANT: This repository is for manual reminders only
 *
 * ARCHITECTURE CONTEXT:
 * - Auto-generated reminders: Managed by Scheduler Service (scheduler.schedules)
 * - Manual reminders: Managed by this repository (appointment_reminders)
 *
 * This repository stores manual reminders in appointments_schema.appointment_reminders.
 * It does NOT interact with Scheduler Service or auto-generated reminders.
 *
 * USE CASES:
 * - Manual reminder creation via CRUD API
 * - Custom reminders outside policy
 * - Local reminder storage and querying
 *
 * @see AppointmentScheduledSchedulerHandler for auto-scheduling
 * @see RemoteSchedulerAdapter for Scheduler Service integration
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';
import { AppointmentReminder, ReminderStatus } from '../../domain/entities/AppointmentReminder.entity';
export declare class SupabaseAppointmentReminderRepository implements IAppointmentReminderRepository {
    private readonly supabase;
    private readonly tableName;
    private readonly schema;
    constructor(supabase: SupabaseClient);
    save(reminder: AppointmentReminder): Promise<void>;
    update(reminder: AppointmentReminder): Promise<void>;
    findById(reminderId: string): Promise<AppointmentReminder | null>;
    findByAppointmentId(appointmentId: string): Promise<AppointmentReminder[]>;
    findPendingReminders(beforeTime: Date): Promise<AppointmentReminder[]>;
    findByStatus(status: ReminderStatus, limit?: number): Promise<AppointmentReminder[]>;
    delete(reminderId: string): Promise<void>;
    deleteByAppointmentId(appointmentId: string): Promise<void>;
    countByAppointmentId(appointmentId: string): Promise<number>;
    private toRow;
    private toDomain;
}
//# sourceMappingURL=SupabaseAppointmentReminderRepository.d.ts.map