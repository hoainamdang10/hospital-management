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
import { 
  AppointmentReminder, 
  AppointmentReminderProps,
  ReminderStatus,
  ReminderType,
  ReminderChannel,
  RecipientType,
  ReminderPriority
} from '../../domain/entities/AppointmentReminder.entity';

interface ReminderRow {
  reminder_id: string;
  appointment_id: string;
  tenant_id: string;
  reminder_type: string;
  reminder_channel: string;
  scheduled_at: string;
  send_before_minutes: number;
  status: string;
  sent_at?: string;
  failed_at?: string;
  failure_reason?: string;
  subject?: string;
  message: string;
  template_id?: string;
  template_data?: any;
  recipient_id: string;
  recipient_type: string;
  recipient_email?: string;
  recipient_phone?: string;
  priority: string;
  retry_count: number;
  max_retries: number;
  metadata?: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseAppointmentReminderRepository implements IAppointmentReminderRepository {
  private readonly tableName = 'appointment_reminders';
  private readonly schema = 'scheduling_schema';

  constructor(private readonly supabase: SupabaseClient) {}

  async save(reminder: AppointmentReminder): Promise<void> {
    const row = this.toRow(reminder);
    
    const { error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .insert(row);

    if (error) {
      throw new Error(`Failed to save reminder: ${error.message}`);
    }
  }

  async update(reminder: AppointmentReminder): Promise<void> {
    const row = this.toRow(reminder);
    
    const { error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .update(row)
      .eq('reminder_id', reminder.reminderId);

    if (error) {
      throw new Error(`Failed to update reminder: ${error.message}`);
    }
  }

  async findById(reminderId: string): Promise<AppointmentReminder | null> {
    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('reminder_id', reminderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find reminder: ${error.message}`);
    }

    return data ? this.toDomain(data as ReminderRow) : null;
  }

  async findByAppointmentId(appointmentId: string): Promise<AppointmentReminder[]> {
    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('scheduled_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to find reminders: ${error.message}`);
    }

    return (data as ReminderRow[]).map(row => this.toDomain(row));
  }

  async findPendingReminders(beforeTime: Date): Promise<AppointmentReminder[]> {
    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('status', ReminderStatus.PENDING)
      .lte('scheduled_at', beforeTime.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(100);

    if (error) {
      throw new Error(`Failed to find pending reminders: ${error.message}`);
    }

    return (data as ReminderRow[]).map(row => this.toDomain(row));
  }

  async findByStatus(status: ReminderStatus, limit: number = 100): Promise<AppointmentReminder[]> {
    const { data, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .select('*')
      .eq('status', status)
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to find reminders by status: ${error.message}`);
    }

    return (data as ReminderRow[]).map(row => this.toDomain(row));
  }

  async delete(reminderId: string): Promise<void> {
    const { error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .delete()
      .eq('reminder_id', reminderId);

    if (error) {
      throw new Error(`Failed to delete reminder: ${error.message}`);
    }
  }

  async deleteByAppointmentId(appointmentId: string): Promise<void> {
    const { error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .delete()
      .eq('appointment_id', appointmentId);

    if (error) {
      throw new Error(`Failed to delete reminders: ${error.message}`);
    }
  }

  async countByAppointmentId(appointmentId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(`${this.schema}.${this.tableName}`)
      .select('*', { count: 'exact', head: true })
      .eq('appointment_id', appointmentId);

    if (error) {
      throw new Error(`Failed to count reminders: ${error.message}`);
    }

    return count || 0;
  }

  private toRow(reminder: AppointmentReminder): Partial<ReminderRow> {
    const props = (reminder as any).props as AppointmentReminderProps;
    
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

  private toDomain(row: ReminderRow): AppointmentReminder {
    const props: AppointmentReminderProps = {
      reminderId: row.reminder_id,
      appointmentId: row.appointment_id,
      tenantId: row.tenant_id,
      reminderType: row.reminder_type as ReminderType,
      reminderChannel: row.reminder_channel as ReminderChannel,
      scheduledAt: new Date(row.scheduled_at),
      sendBeforeMinutes: row.send_before_minutes,
      status: row.status as ReminderStatus,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      failedAt: row.failed_at ? new Date(row.failed_at) : undefined,
      failureReason: row.failure_reason,
      subject: row.subject,
      message: row.message,
      templateId: row.template_id,
      templateData: row.template_data,
      recipientId: row.recipient_id,
      recipientType: row.recipient_type as RecipientType,
      recipientEmail: row.recipient_email,
      recipientPhone: row.recipient_phone,
      priority: row.priority as ReminderPriority,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      metadata: row.metadata,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };

    return AppointmentReminder.reconstitute(props);
  }
}

