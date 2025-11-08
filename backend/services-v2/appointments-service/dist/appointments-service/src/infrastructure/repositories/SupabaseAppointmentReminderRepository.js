"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAppointmentReminderRepository = void 0;
const AppointmentReminder_entity_1 = require("../../domain/entities/AppointmentReminder.entity");
class SupabaseAppointmentReminderRepository {
    constructor(supabase) {
        this.supabase = supabase;
        this.tableName = 'appointment_reminders';
        this.schema = 'scheduling_schema';
    }
    async save(reminder) {
        const row = this.toRow(reminder);
        const { error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .insert(row);
        if (error) {
            throw new Error(`Failed to save reminder: ${error.message}`);
        }
    }
    async update(reminder) {
        const row = this.toRow(reminder);
        const { error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .update(row)
            .eq('reminder_id', reminder.reminderId);
        if (error) {
            throw new Error(`Failed to update reminder: ${error.message}`);
        }
    }
    async findById(reminderId) {
        const { data, error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('reminder_id', reminderId)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // Not found
            throw new Error(`Failed to find reminder: ${error.message}`);
        }
        return data ? this.toDomain(data) : null;
    }
    async findByAppointmentId(appointmentId) {
        const { data, error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('appointment_id', appointmentId)
            .order('scheduled_at', { ascending: true });
        if (error) {
            throw new Error(`Failed to find reminders: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    async findPendingReminders(beforeTime) {
        const { data, error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('status', AppointmentReminder_entity_1.ReminderStatus.PENDING)
            .lte('scheduled_at', beforeTime.toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(100);
        if (error) {
            throw new Error(`Failed to find pending reminders: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    async findByStatus(status, limit = 100) {
        const { data, error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*')
            .eq('status', status)
            .order('scheduled_at', { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Failed to find reminders by status: ${error.message}`);
        }
        return data.map(row => this.toDomain(row));
    }
    async delete(reminderId) {
        const { error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .delete()
            .eq('reminder_id', reminderId);
        if (error) {
            throw new Error(`Failed to delete reminder: ${error.message}`);
        }
    }
    async deleteByAppointmentId(appointmentId) {
        const { error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .delete()
            .eq('appointment_id', appointmentId);
        if (error) {
            throw new Error(`Failed to delete reminders: ${error.message}`);
        }
    }
    async countByAppointmentId(appointmentId) {
        const { count, error } = await this.supabase
            .from(`${this.schema}.${this.tableName}`)
            .select('*', { count: 'exact', head: true })
            .eq('appointment_id', appointmentId);
        if (error) {
            throw new Error(`Failed to count reminders: ${error.message}`);
        }
        return count || 0;
    }
    toRow(reminder) {
        const props = reminder.props;
        return {
            reminder_id: props.reminderId,
            appointment_id: props.appointmentId,
            tenant_id: props.tenantId,
            reminder_type: props.reminderType,
            reminder_channel: props.reminderChannel,
            scheduled_at: props.scheduledAt.toISOString(),
            send_before_minutes: props.sendBeforeMinutes,
            status: props.status,
            sent_at: props.sentAt?.toISOString(),
            failed_at: props.failedAt?.toISOString(),
            failure_reason: props.failureReason,
            subject: props.subject,
            message: props.message,
            template_id: props.templateId,
            template_data: props.templateData,
            recipient_id: props.recipientId,
            recipient_type: props.recipientType,
            recipient_email: props.recipientEmail,
            recipient_phone: props.recipientPhone,
            priority: props.priority,
            retry_count: props.retryCount,
            max_retries: props.maxRetries,
            metadata: props.metadata,
            created_by: props.createdBy,
            created_at: props.createdAt.toISOString(),
            updated_at: props.updatedAt.toISOString()
        };
    }
    toDomain(row) {
        const props = {
            reminderId: row.reminder_id,
            appointmentId: row.appointment_id,
            tenantId: row.tenant_id,
            reminderType: row.reminder_type,
            reminderChannel: row.reminder_channel,
            scheduledAt: new Date(row.scheduled_at),
            sendBeforeMinutes: row.send_before_minutes,
            status: row.status,
            sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
            failedAt: row.failed_at ? new Date(row.failed_at) : undefined,
            failureReason: row.failure_reason,
            subject: row.subject,
            message: row.message,
            templateId: row.template_id,
            templateData: row.template_data,
            recipientId: row.recipient_id,
            recipientType: row.recipient_type,
            recipientEmail: row.recipient_email,
            recipientPhone: row.recipient_phone,
            priority: row.priority,
            retryCount: row.retry_count,
            maxRetries: row.max_retries,
            metadata: row.metadata,
            createdBy: row.created_by,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
        return AppointmentReminder_entity_1.AppointmentReminder.reconstitute(props);
    }
}
exports.SupabaseAppointmentReminderRepository = SupabaseAppointmentReminderRepository;
//# sourceMappingURL=SupabaseAppointmentReminderRepository.js.map