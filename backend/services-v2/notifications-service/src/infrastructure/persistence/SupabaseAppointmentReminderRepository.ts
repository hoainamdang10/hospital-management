/**
 * SupabaseAppointmentReminderRepository - Infrastructure Repository Implementation
 * Implements IAppointmentReminderRepository for Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { IAppointmentReminderRepository } from "../../domain/repositories/IAppointmentReminderRepository";
import { AppointmentReminder } from "../../domain/aggregates/AppointmentReminder";
import { ReminderType } from "../../domain/value-objects/ReminderType";
import { ReminderStatus } from "../../domain/value-objects/ReminderStatus";

interface ReminderRecord {
  reminder_id: string;
  appointment_id: string;
  tenant_id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  patient_language?: string;
  doctor_id?: string;
  doctor_name?: string;
  doctor_specialization?: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type?: string;
  reason?: string;
  reminder_type: string;
  scheduled_send_time: string;
  offset_hours?: number | null;
  offset_minutes?: number | null;
  template_id?: string;
  template_language?: string;
  notification_channels?: string[];
  status: string;
  sent_at?: string;
  failed_at?: string;
  failure_reason?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  notification_id?: string;
  delivery_results?: any;
  retry_count?: number;
  max_retries?: number;
  last_retry_at?: string;
  next_retry_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
  cancelled_by?: string;
}

type ReminderPersistence = ReturnType<AppointmentReminder["toPersistence"]>;

export class SupabaseAppointmentReminderRepository
  implements IAppointmentReminderRepository
{
  private readonly tableName = "appointment_reminders";

  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Save (create or update) a reminder
   */
  public async save(reminder: AppointmentReminder): Promise<void> {
    try {
      const record = this.mapToRecord(reminder);

      const { error } = await this.supabase
        .from(this.tableName)
        .upsert(record, {
          onConflict: "appointment_id,reminder_type",
        });

      if (error) {
        console.error(
          "[SupabaseAppointmentReminderRepository] Save failed:",
          error,
        );
        throw new Error(`Failed to save reminder: ${error.message}`);
      }
    } catch (error: any) {
      console.error(
        "[SupabaseAppointmentReminderRepository] Save exception:",
        error,
      );
      throw error;
    }
  }

  /**
   * Find reminder by ID
   */
  public async findById(
    reminderId: string,
  ): Promise<AppointmentReminder | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("reminder_id", reminderId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Not found
        }
        throw new Error(`Failed to find reminder: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return this.mapToDomain(data);
    } catch (error: any) {
      console.error(
        "[SupabaseAppointmentReminderRepository] FindById exception:",
        error,
      );
      throw error;
    }
  }

  /**
   * Find reminders by appointment ID
   */
  public async findByAppointmentId(
    appointmentId: string,
  ): Promise<AppointmentReminder[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("appointment_id", appointmentId)
        .order("scheduled_send_time", { ascending: true });

      if (error) {
        throw new Error(`Failed to find reminders: ${error.message}`);
      }

      return (data || []).map((record) => this.mapToDomain(record));
    } catch (error: any) {
      console.error(
        "[SupabaseAppointmentReminderRepository] FindByAppointmentId exception:",
        error,
      );
      throw error;
    }
  }

  /**
   * Find due reminders (status = PENDING and scheduled_send_time <= now)
   */
  public async findDueReminders(
    currentTime: Date,
  ): Promise<AppointmentReminder[]> {
    try {
      const now = currentTime.toISOString();

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .in("status", ["SCHEDULED"]) // mapped from domain PENDING/PROCESSING
        .lte("scheduled_send_time", now)
        .order("scheduled_send_time", { ascending: true })
        .limit(100);

      if (error) {
        throw new Error(`Failed to find due reminders: ${error.message}`);
      }

      const reminders = (data || []).map((record) => this.mapToDomain(record));
      console.log(
        `[SupabaseAppointmentReminderRepository] Found ${reminders.length} due reminders`,
      );
      return reminders;
    } catch (error: any) {
      console.error(
        "[SupabaseAppointmentReminderRepository] FindDueReminders exception:",
        error,
      );
      throw error;
    }
  }

  /**
   * Find failed reminders that can be retried
   */
  public async findRetriableReminders(): Promise<AppointmentReminder[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("status", "FAILED")
        .not("next_retry_at", "is", null)
        .lte("next_retry_at", now)
        .order("next_retry_at", { ascending: true })
        .limit(50);

      if (error) {
        throw new Error(`Failed to find retryable reminders: ${error.message}`);
      }

      const reminders = (data || [])
        .map((record) => this.mapToDomain(record))
        .filter((reminder) => reminder.canRetry());

      return reminders;
    } catch (error: any) {
      console.error(
        "[SupabaseAppointmentReminderRepository] FindRetryableReminders exception:",
        error,
      );
      throw error;
    }
  }

  /**
   * Cancel all reminders for an appointment
   */
  public async cancelByAppointmentId(
    appointmentId: string,
    reason: string,
    cancelledBy: string,
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      const { error } = await this.supabase
        .from(this.tableName)
        .update({
          status: "CANCELLED",
          cancelled_at: now,
          cancelled_by: cancelledBy,
          cancellation_reason: reason,
          updated_at: now,
        })
        .eq("appointment_id", appointmentId)
        .in("status", ["SCHEDULED", "FAILED"]);

      if (error) {
        throw new Error(`Failed to cancel reminders: ${error.message}`);
      }

      console.log(
        `[SupabaseAppointmentReminderRepository] Cancelled reminders for appointment ${appointmentId}`,
      );
    } catch (error: any) {
      console.error(
        "[SupabaseAppointmentReminderRepository] CancelByAppointmentId exception:",
        error,
      );
      throw error;
    }
  }

  /**
   * Delete reminder by ID
   */
  public async delete(reminderId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq("reminder_id", reminderId);

      if (error) {
        throw new Error(`Failed to delete reminder: ${error.message}`);
      }
    } catch (error: any) {
      console.error(
        "[SupabaseAppointmentReminderRepository] Delete exception:",
        error,
      );
      throw error;
    }
  }

  // ==================================================
  // Mapping Functions
  // ==================================================

  /**
   * Map domain aggregate to database record
   */
  private mapToRecord(reminder: AppointmentReminder): ReminderRecord {
    const persistence = reminder.toPersistence() as ReminderPersistence;
    const nowIso = new Date().toISOString();
    const metadata = this.buildMetadata(persistence);
    const deliveryResults =
      metadata.delivery_results || persistence.metadata?.delivery_results || [];

    // remove duplicated delivery results from metadata payload
    if (metadata.delivery_results) {
      delete metadata.delivery_results;
    }

    const offsets = this.calculateOffsets(persistence.reminder_type);

    return {
      reminder_id: reminder.id,
      appointment_id: persistence.appointment_id,
      tenant_id: persistence.tenant_id || "hospital-1",
      patient_id: persistence.patient_id,
      patient_name: persistence.patient_name,
      patient_phone: persistence.patient_phone,
      patient_email: persistence.patient_email,
      patient_language: persistence.patient_language || "vi",
      doctor_id: persistence.doctor_id,
      doctor_name: persistence.doctor_name,
      doctor_specialization: persistence.doctor_specialization,
      appointment_date: this.formatDateOnly(persistence.appointment_date),
      appointment_time: persistence.appointment_time,
      appointment_type: persistence.appointment_type,
      reason: persistence.reason,
      reminder_type: persistence.reminder_type,
      scheduled_send_time: persistence.scheduled_send_time.toISOString(),
      offset_hours: offsets.hours,
      offset_minutes: offsets.minutes,
      template_id: persistence.template_id,
      template_language: persistence.patient_language || "vi",
      notification_channels:
        persistence.channels && persistence.channels.length
          ? persistence.channels
          : ["SMS", "EMAIL"],
      status: this.mapStatusToDb(persistence.status),
      sent_at: persistence.sent_at?.toISOString(),
      failed_at: persistence.failed_at?.toISOString(),
      failure_reason: persistence.failure_reason,
      cancelled_at: persistence.cancelled_at?.toISOString(),
      cancellation_reason: persistence.cancellation_reason,
      notification_id: persistence.notification_id,
      delivery_results: deliveryResults,
      retry_count: persistence.retry_count ?? 0,
      max_retries: persistence.max_retries ?? 3,
      last_retry_at: persistence.last_retry_at?.toISOString(),
      next_retry_at: persistence.next_retry_at?.toISOString(),
      metadata,
      created_at: persistence.created_at
        ? new Date(persistence.created_at).toISOString()
        : nowIso,
      updated_at: persistence.updated_at
        ? new Date(persistence.updated_at).toISOString()
        : nowIso,
      created_by: persistence.created_by,
      cancelled_by: persistence.cancelled_by,
    };
  }

  /**
   * Map database record to domain aggregate
   */
  private mapToDomain(record: ReminderRecord): AppointmentReminder {
    const metadata = record.metadata || {};
    const preferredChannel =
      metadata.preferred_channel ?? metadata.preferredChannel;
    const templateData = metadata.template_data ?? metadata.templateData ?? {};
    const customMessage = metadata.custom_message ?? metadata.customMessage;
    const deliveredAtIso = metadata.delivered_at ?? metadata.deliveredAt;

    return AppointmentReminder.create(
      {
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
        reminderType: ReminderType.fromString(record.reminder_type),
        scheduledSendTime: new Date(record.scheduled_send_time),
        status: this.mapStatusFromDb(record.status),
        channels: record.notification_channels || [],
        preferredChannel,
        notificationId: record.notification_id,
        sentAt: record.sent_at ? new Date(record.sent_at) : undefined,
        deliveredAt: deliveredAtIso ? new Date(deliveredAtIso) : undefined,
        failedAt: record.failed_at ? new Date(record.failed_at) : undefined,
        failureReason: record.failure_reason,
        retryCount: record.retry_count ?? undefined,
        maxRetries: record.max_retries ?? undefined,
        lastRetryAt: record.last_retry_at
          ? new Date(record.last_retry_at)
          : undefined,
        nextRetryAt: record.next_retry_at
          ? new Date(record.next_retry_at)
          : undefined,
        templateId: record.template_id,
        templateData,
        customMessage,
        cancelledAt: record.cancelled_at
          ? new Date(record.cancelled_at)
          : undefined,
        cancelledBy: record.cancelled_by,
        cancellationReason: record.cancellation_reason,
        metadata,
        createdAt: record.created_at ? new Date(record.created_at) : undefined,
        updatedAt: record.updated_at ? new Date(record.updated_at) : undefined,
        createdBy: record.created_by,
      },
      record.reminder_id,
    );
  }

  private formatDateOnly(value: Date | string | undefined): string {
    if (!value) {
      return new Date().toISOString().split("T")[0];
    }

    const date = typeof value === "string" ? new Date(value) : value;
    return date.toISOString().split("T")[0];
  }

  private calculateOffsets(reminderType: string): {
    hours: number | null;
    minutes: number | null;
  } {
    switch (reminderType) {
      case "24H_BEFORE":
        return { hours: 24, minutes: 0 };
      case "2H_BEFORE":
        return { hours: 2, minutes: 0 };
      case "30M_BEFORE":
        return { hours: 0, minutes: 30 };
      default:
        return { hours: null, minutes: null };
    }
  }

  private buildMetadata(persistence: ReminderPersistence): Record<string, any> {
    const metadata: Record<string, any> = {
      ...(persistence.metadata || {}),
    };

    if (persistence.preferred_channel) {
      metadata.preferred_channel = persistence.preferred_channel;
    }

    if (persistence.template_data) {
      metadata.template_data = persistence.template_data;
    }

    if (persistence.custom_message) {
      metadata.custom_message = persistence.custom_message;
    }

    if (persistence.delivered_at) {
      metadata.delivered_at = new Date(persistence.delivered_at).toISOString();
    }

    return metadata;
  }

  private mapStatusToDb(status: string): string {
    switch (status) {
      case "PENDING":
      case "PROCESSING":
        return "SCHEDULED";
      case "SENT":
        return "SENT";
      case "FAILED":
        return "FAILED";
      case "CANCELLED":
        return "CANCELLED";
      case "EXPIRED":
        return "SKIPPED";
      default:
        return "SCHEDULED";
    }
  }

  private mapStatusFromDb(status: string): ReminderStatus {
    switch (status) {
      case "SCHEDULED":
        return ReminderStatus.PENDING;
      case "SENT":
        return ReminderStatus.SENT;
      case "FAILED":
        return ReminderStatus.FAILED;
      case "CANCELLED":
        return ReminderStatus.CANCELLED;
      case "SKIPPED":
        return ReminderStatus.EXPIRED;
      default:
        return ReminderStatus.PENDING;
    }
  }
}
