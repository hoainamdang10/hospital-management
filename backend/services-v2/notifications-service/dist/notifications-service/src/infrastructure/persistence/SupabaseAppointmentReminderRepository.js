"use strict";
/**
 * SupabaseAppointmentReminderRepository - Infrastructure Repository Implementation
 * Implements IAppointmentReminderRepository for Supabase
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAppointmentReminderRepository = void 0;
const Result_1 = require("@shared/core/Result");
const UniqueEntityID_1 = require("@shared/domain/base/UniqueEntityID");
const AppointmentReminder_1 = require("../../domain/aggregates/AppointmentReminder");
const ReminderType_1 = require("../../domain/value-objects/ReminderType");
const ReminderStatus_1 = require("../../domain/value-objects/ReminderStatus");
class SupabaseAppointmentReminderRepository {
    constructor(supabase) {
        this.supabase = supabase;
        this.tableName = 'notifications_schema.appointment_reminders';
    }
    // ==================================================
    // Core CRUD Operations
    // ==================================================
    /**
     * Save (create or update) a reminder
     */
    async save(reminder) {
        try {
            const record = this.mapToRecord(reminder);
            const { error } = await this.supabase
                .from(this.tableName)
                .upsert(record, {
                onConflict: 'reminder_id',
            });
            if (error) {
                console.error('[SupabaseAppointmentReminderRepository] Save failed:', error);
                return Result_1.Result.fail(`Failed to save reminder: ${error.message}`);
            }
            return Result_1.Result.ok();
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] Save exception:', error);
            return Result_1.Result.fail(`Exception saving reminder: ${error.message}`);
        }
    }
    /**
     * Find reminder by ID
     */
    async findById(reminderId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('reminder_id', reminderId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    // Not found
                    return Result_1.Result.ok(null);
                }
                return Result_1.Result.fail(`Failed to find reminder: ${error.message}`);
            }
            if (!data) {
                return Result_1.Result.ok(null);
            }
            const reminderResult = this.mapToDomain(data);
            if (reminderResult.isFailure) {
                return Result_1.Result.fail(reminderResult.getError());
            }
            return Result_1.Result.ok(reminderResult.getValue());
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] FindById exception:', error);
            return Result_1.Result.fail(`Exception finding reminder: ${error.message}`);
        }
    }
    /**
     * Find reminders by appointment ID
     */
    async findByAppointmentId(appointmentId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('appointment_id', appointmentId)
                .order('scheduled_send_time', { ascending: true });
            if (error) {
                return Result_1.Result.fail(`Failed to find reminders: ${error.message}`);
            }
            const reminders = [];
            for (const record of data || []) {
                const reminderResult = this.mapToDomain(record);
                if (reminderResult.isSuccess) {
                    reminders.push(reminderResult.getValue());
                }
            }
            return Result_1.Result.ok(reminders);
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] FindByAppointmentId exception:', error);
            return Result_1.Result.fail(`Exception finding reminders: ${error.message}`);
        }
    }
    /**
     * Find due reminders (status = PENDING and scheduled_send_time <= now)
     */
    async findDueReminders(limit = 100) {
        try {
            const now = new Date().toISOString();
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('status', 'PENDING')
                .lte('scheduled_send_time', now)
                .order('scheduled_send_time', { ascending: true })
                .limit(limit);
            if (error) {
                return Result_1.Result.fail(`Failed to find due reminders: ${error.message}`);
            }
            const reminders = [];
            for (const record of data || []) {
                const reminderResult = this.mapToDomain(record);
                if (reminderResult.isSuccess) {
                    reminders.push(reminderResult.getValue());
                }
            }
            console.log(`[SupabaseAppointmentReminderRepository] Found ${reminders.length} due reminders`);
            return Result_1.Result.ok(reminders);
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] FindDueReminders exception:', error);
            return Result_1.Result.fail(`Exception finding due reminders: ${error.message}`);
        }
    }
    /**
     * Find failed reminders that can be retried
     */
    async findRetryableReminders(limit = 50) {
        try {
            const now = new Date().toISOString();
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('status', 'FAILED')
                .lte('next_retry_at', now)
                .order('next_retry_at', { ascending: true })
                .limit(limit);
            if (error) {
                return Result_1.Result.fail(`Failed to find retryable reminders: ${error.message}`);
            }
            const reminders = [];
            for (const record of data || []) {
                const reminderResult = this.mapToDomain(record);
                if (reminderResult.isSuccess) {
                    const reminder = reminderResult.getValue();
                    if (reminder.canRetry()) {
                        reminders.push(reminder);
                    }
                }
            }
            return Result_1.Result.ok(reminders);
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] FindRetryableReminders exception:', error);
            return Result_1.Result.fail(`Exception finding retryable reminders: ${error.message}`);
        }
    }
    /**
     * Find reminders by patient ID
     */
    async findByPatientId(patientId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('patient_id', patientId)
                .order('appointment_date', { ascending: false })
                .limit(50);
            if (error) {
                return Result_1.Result.fail(`Failed to find reminders: ${error.message}`);
            }
            const reminders = [];
            for (const record of data || []) {
                const reminderResult = this.mapToDomain(record);
                if (reminderResult.isSuccess) {
                    reminders.push(reminderResult.getValue());
                }
            }
            return Result_1.Result.ok(reminders);
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] FindByPatientId exception:', error);
            return Result_1.Result.fail(`Exception finding reminders: ${error.message}`);
        }
    }
    /**
     * Cancel all reminders for an appointment
     */
    async cancelByAppointmentId(appointmentId, reason, cancelledBy) {
        try {
            const now = new Date().toISOString();
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update({
                status: 'CANCELLED',
                cancelled_at: now,
                cancelled_by: cancelledBy,
                cancellation_reason: reason,
                updated_at: now,
            })
                .eq('appointment_id', appointmentId)
                .in('status', ['PENDING', 'FAILED'])
                .select('reminder_id');
            if (error) {
                return Result_1.Result.fail(`Failed to cancel reminders: ${error.message}`);
            }
            const count = data?.length || 0;
            console.log(`[SupabaseAppointmentReminderRepository] Cancelled ${count} reminders for appointment ${appointmentId}`);
            return Result_1.Result.ok(count);
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] CancelByAppointmentId exception:', error);
            return Result_1.Result.fail(`Exception cancelling reminders: ${error.message}`);
        }
    }
    /**
     * Mark old reminders as expired (past appointment date)
     */
    async expireOldReminders() {
        try {
            const now = new Date().toISOString();
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update({
                status: 'EXPIRED',
                updated_at: now,
            })
                .eq('status', 'PENDING')
                .lt('appointment_date', today)
                .select('reminder_id');
            if (error) {
                return Result_1.Result.fail(`Failed to expire reminders: ${error.message}`);
            }
            const count = data?.length || 0;
            if (count > 0) {
                console.log(`[SupabaseAppointmentReminderRepository] Expired ${count} old reminders`);
            }
            return Result_1.Result.ok(count);
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] ExpireOldReminders exception:', error);
            return Result_1.Result.fail(`Exception expiring reminders: ${error.message}`);
        }
    }
    /**
     * Delete reminder by ID
     */
    async delete(reminderId) {
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .eq('reminder_id', reminderId);
            if (error) {
                return Result_1.Result.fail(`Failed to delete reminder: ${error.message}`);
            }
            return Result_1.Result.ok();
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] Delete exception:', error);
            return Result_1.Result.fail(`Exception deleting reminder: ${error.message}`);
        }
    }
    /**
     * Count pending reminders
     */
    async countPending() {
        try {
            const { count, error } = await this.supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING');
            if (error) {
                return Result_1.Result.fail(`Failed to count reminders: ${error.message}`);
            }
            return Result_1.Result.ok(count || 0);
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] CountPending exception:', error);
            return Result_1.Result.fail(`Exception counting reminders: ${error.message}`);
        }
    }
    /**
     * Count reminders by status
     */
    async countByStatus(status) {
        try {
            const { count, error } = await this.supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true })
                .eq('status', status);
            if (error) {
                return Result_1.Result.fail(`Failed to count reminders: ${error.message}`);
            }
            return Result_1.Result.ok(count || 0);
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] CountByStatus exception:', error);
            return Result_1.Result.fail(`Exception counting reminders: ${error.message}`);
        }
    }
    // ==================================================
    // Mapping Functions
    // ==================================================
    /**
     * Map domain aggregate to database record
     */
    mapToRecord(reminder) {
        return {
            reminder_id: reminder.reminderId.toString(),
            appointment_id: reminder.appointmentId,
            tenant_id: reminder.tenantId,
            patient_id: reminder.patientId,
            patient_name: reminder.patientName,
            patient_phone: reminder.patientPhone,
            patient_email: reminder.patientEmail,
            patient_language: reminder['props'].patientLanguage,
            doctor_id: reminder['props'].doctorId,
            doctor_name: reminder.doctorName,
            doctor_specialization: reminder['props'].doctorSpecialization,
            appointment_date: reminder.appointmentDate.toISOString().split('T')[0],
            appointment_time: reminder.appointmentTime,
            appointment_type: reminder['props'].appointmentType,
            reason: reminder['props'].reason,
            reminder_type: reminder.reminderType.toString(),
            scheduled_send_time: reminder.scheduledSendTime.toISOString(),
            status: reminder.status.toString(),
            channels: reminder['props'].channels,
            preferred_channel: reminder['props'].preferredChannel,
            notification_id: reminder.notificationId,
            sent_at: reminder.sentAt?.toISOString(),
            delivered_at: reminder['props'].deliveredAt?.toISOString(),
            failed_at: reminder['props'].failedAt?.toISOString(),
            failure_reason: reminder['props'].failureReason,
            retry_count: reminder.retryCount,
            max_retries: reminder.maxRetries,
            last_retry_at: reminder['props'].lastRetryAt?.toISOString(),
            next_retry_at: reminder['props'].nextRetryAt?.toISOString(),
            template_id: reminder['props'].templateId,
            template_data: reminder.templateData,
            custom_message: reminder['props'].customMessage,
            cancelled_at: reminder['props'].cancelledAt?.toISOString(),
            cancelled_by: reminder['props'].cancelledBy,
            cancellation_reason: reminder['props'].cancellationReason,
            metadata: reminder['props'].metadata,
            created_at: reminder['props'].createdAt?.toISOString() || new Date().toISOString(),
            updated_at: reminder['props'].updatedAt?.toISOString() || new Date().toISOString(),
            created_by: reminder['props'].createdBy,
        };
    }
    /**
     * Map database record to domain aggregate
     */
    mapToDomain(record) {
        try {
            return AppointmentReminder_1.AppointmentReminder.create({
                appointmentId: record.appointment_id,
                tenantId: record.tenant_id,
                patientId: record.patient_id,
                patientName: record.patient_name,
                patientPhone: record.patient_phone,
                patientEmail: record.patient_email,
                patientLanguage: record.patient_language,
                doctorId: record.doctor_id,
                doctorName: record.doctor_name,
                doctorSpecialization: record.doctor_specialization,
                appointmentDate: new Date(record.appointment_date),
                appointmentTime: record.appointment_time,
                appointmentType: record.appointment_type,
                reason: record.reason,
                reminderType: ReminderType_1.ReminderType.fromString(record.reminder_type),
                scheduledSendTime: new Date(record.scheduled_send_time),
                status: ReminderStatus_1.ReminderStatus.fromString(record.status),
                channels: record.channels,
                preferredChannel: record.preferred_channel,
                notificationId: record.notification_id,
                sentAt: record.sent_at ? new Date(record.sent_at) : undefined,
                deliveredAt: record.delivered_at ? new Date(record.delivered_at) : undefined,
                failedAt: record.failed_at ? new Date(record.failed_at) : undefined,
                failureReason: record.failure_reason,
                retryCount: record.retry_count,
                maxRetries: record.max_retries,
                lastRetryAt: record.last_retry_at ? new Date(record.last_retry_at) : undefined,
                nextRetryAt: record.next_retry_at ? new Date(record.next_retry_at) : undefined,
                templateId: record.template_id,
                templateData: record.template_data,
                customMessage: record.custom_message,
                cancelledAt: record.cancelled_at ? new Date(record.cancelled_at) : undefined,
                cancelledBy: record.cancelled_by,
                cancellationReason: record.cancellation_reason,
                metadata: record.metadata,
                createdAt: new Date(record.created_at),
                updatedAt: new Date(record.updated_at),
                createdBy: record.created_by,
            }, new UniqueEntityID_1.UniqueEntityID(record.reminder_id));
        }
        catch (error) {
            return Result_1.Result.fail(`Failed to map record to domain: ${error.message}`);
        }
    }
}
exports.SupabaseAppointmentReminderRepository = SupabaseAppointmentReminderRepository;
//# sourceMappingURL=SupabaseAppointmentReminderRepository.js.map