"use strict";
/**
 * SupabaseAppointmentReminderRepository - Infrastructure Repository Implementation
 * Implements IAppointmentReminderRepository for Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAppointmentReminderRepository = void 0;
const AppointmentReminder_1 = require("../../domain/aggregates/AppointmentReminder");
const ReminderType_1 = require("../../domain/value-objects/ReminderType");
const ReminderStatus_1 = require("../../domain/value-objects/ReminderStatus");
class SupabaseAppointmentReminderRepository {
    constructor(supabase) {
        this.supabase = supabase;
        this.tableName = 'appointment_reminders';
    }
    /**
     * Save (create or update) a reminder
     */
    async save(reminder) {
        try {
            const record = this.mapToRecord(reminder);
            const { error } = await this.supabase
                .from(this.tableName)
                .upsert(record, {
                onConflict: 'id',
            });
            if (error) {
                console.error('[SupabaseAppointmentReminderRepository] Save failed:', error);
                throw new Error(`Failed to save reminder: ${error.message}`);
            }
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] Save exception:', error);
            throw error;
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
                .eq('id', reminderId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Not found
                }
                throw new Error(`Failed to find reminder: ${error.message}`);
            }
            if (!data) {
                return null;
            }
            return this.mapToDomain(data);
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] FindById exception:', error);
            throw error;
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
                throw new Error(`Failed to find reminders: ${error.message}`);
            }
            return (data || []).map(record => this.mapToDomain(record));
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] FindByAppointmentId exception:', error);
            throw error;
        }
    }
    /**
     * Find due reminders (status = PENDING and scheduled_send_time <= now)
     */
    async findDueReminders(currentTime) {
        try {
            const now = currentTime.toISOString();
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('status', 'PENDING')
                .lte('scheduled_send_time', now)
                .order('scheduled_send_time', { ascending: true })
                .limit(100);
            if (error) {
                throw new Error(`Failed to find due reminders: ${error.message}`);
            }
            const reminders = (data || []).map(record => this.mapToDomain(record));
            console.log(`[SupabaseAppointmentReminderRepository] Found ${reminders.length} due reminders`);
            return reminders;
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] FindDueReminders exception:', error);
            throw error;
        }
    }
    /**
     * Find failed reminders that can be retried
     */
    async findRetriableReminders() {
        try {
            const now = new Date().toISOString();
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('status', 'FAILED')
                .not('next_retry_at', 'is', null)
                .lte('next_retry_at', now)
                .order('next_retry_at', { ascending: true })
                .limit(50);
            if (error) {
                throw new Error(`Failed to find retryable reminders: ${error.message}`);
            }
            const reminders = (data || [])
                .map(record => this.mapToDomain(record))
                .filter(reminder => reminder.canRetry());
            return reminders;
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] FindRetryableReminders exception:', error);
            throw error;
        }
    }
    /**
     * Cancel all reminders for an appointment
     */
    async cancelByAppointmentId(appointmentId, reason, cancelledBy) {
        try {
            const now = new Date().toISOString();
            const { error } = await this.supabase
                .from(this.tableName)
                .update({
                status: 'CANCELLED',
                cancelled_at: now,
                cancelled_by: cancelledBy,
                cancellation_reason: reason,
                updated_at: now,
            })
                .eq('appointment_id', appointmentId)
                .in('status', ['PENDING', 'FAILED']);
            if (error) {
                throw new Error(`Failed to cancel reminders: ${error.message}`);
            }
            console.log(`[SupabaseAppointmentReminderRepository] Cancelled reminders for appointment ${appointmentId}`);
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] CancelByAppointmentId exception:', error);
            throw error;
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
                .eq('id', reminderId);
            if (error) {
                throw new Error(`Failed to delete reminder: ${error.message}`);
            }
        }
        catch (error) {
            console.error('[SupabaseAppointmentReminderRepository] Delete exception:', error);
            throw error;
        }
    }
    // ==================================================
    // Mapping Functions
    // ==================================================
    /**
     * Map domain aggregate to database record
     */
    mapToRecord(reminder) {
        const persistence = reminder.toPersistence();
        return {
            id: reminder.id,
            appointment_id: persistence.appointment_id,
            tenant_id: persistence.tenant_id,
            patient_id: persistence.patient_id,
            patient_name: persistence.patient_name,
            patient_phone: persistence.patient_phone,
            patient_email: persistence.patient_email,
            patient_language: persistence.patient_language,
            doctor_id: persistence.doctor_id,
            doctor_name: persistence.doctor_name,
            doctor_specialization: persistence.doctor_specialization,
            appointment_date: persistence.appointment_date.toISOString().split('T')[0],
            appointment_time: persistence.appointment_time,
            appointment_type: persistence.appointment_type,
            reason: persistence.reason,
            reminder_type: persistence.reminder_type,
            scheduled_send_time: persistence.scheduled_send_time.toISOString(),
            status: persistence.status,
            channels: persistence.channels,
            preferred_channel: persistence.preferred_channel,
            notification_id: persistence.notification_id,
            sent_at: persistence.sent_at?.toISOString(),
            delivered_at: persistence.delivered_at?.toISOString(),
            failed_at: persistence.failed_at?.toISOString(),
            failure_reason: persistence.failure_reason,
            retry_count: persistence.retry_count,
            max_retries: persistence.max_retries,
            last_retry_at: persistence.last_retry_at?.toISOString(),
            next_retry_at: persistence.next_retry_at?.toISOString(),
            template_id: persistence.template_id,
            template_data: persistence.template_data,
            custom_message: persistence.custom_message,
            cancelled_at: persistence.cancelled_at?.toISOString(),
            cancelled_by: persistence.cancelled_by,
            cancellation_reason: persistence.cancellation_reason,
            metadata: persistence.metadata,
            created_by: persistence.created_by,
        };
    }
    /**
     * Map database record to domain aggregate
     */
    mapToDomain(record) {
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
        }, record.id);
    }
}
exports.SupabaseAppointmentReminderRepository = SupabaseAppointmentReminderRepository;
//# sourceMappingURL=SupabaseAppointmentReminderRepository.js.map