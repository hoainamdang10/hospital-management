/**
 * AppointmentReminder Entity - Domain Layer
 * Represents a MANUALLY CREATED reminder for an appointment
 *
 *  ARCHITECTURE NOTE: ALTERNATIVE APPROACH 
 *
 * This entity provides manual reminder management as an ALTERNATIVE to the existing
 * auto-scheduling system. Most reminders should use the Scheduler Service integration.
 *
 * EXISTING INTEGRATION (Preferred):
 * - Appointments Service → Scheduler Service (via event-driven architecture)
 * - Auto-generated reminders when appointment is created
 * - Managed by: AppointmentScheduledSchedulerHandler
 * - Storage: scheduler.schedules table in Supabase
 * - Policy-based: src/config/reminder-policy.json
 *
 * THIS ENTITY (Alternative):
 * - Manual reminder creation via CRUD API
 * - Local storage in appointments_schema.appointment_reminders
 * - Use cases:
 *   1. Custom reminders outside policy (e.g., special patient requests)
 *   2. One-off reminders not tied to appointment lifecycle
 *   3. Override auto-generated reminders for specific cases
 *   4. Testing/debugging reminder functionality
 *
 * WHEN TO USE:
 * - Manual control needed for specific reminders
 * - Custom reminder logic beyond policy
 * - Local storage/querying required
 *
 * WHEN NOT TO USE:
 * - Standard appointment reminders → Use Scheduler Service integration
 * - Policy-based reminders → Already auto-generated
 * - Bulk reminder operations → Use Scheduler Service API
 *
 * COEXISTENCE:
 * Both systems can coexist:
 * - Auto-generated reminders: scheduler.schedules (via Scheduler Service)
 * - Manual reminders: appointment_reminders (via this entity)
 * - No conflicts as they use different storage and workflows
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 * @see AppointmentScheduledSchedulerHandler for auto-scheduling implementation
 * @see RemoteSchedulerAdapter for Scheduler Service integration
 */

import { Entity } from "@shared/domain/base/entity";
import crypto from "crypto";

export enum ReminderType {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
  IN_APP = "in_app",
}

export enum ReminderChannel {
  EMAIL = "email",
  SMS = "sms",
  PUSH_NOTIFICATION = "push_notification",
  IN_APP_NOTIFICATION = "in_app_notification",
}

export enum ReminderStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum RecipientType {
  PATIENT = "patient",
  DOCTOR = "doctor",
  BOTH = "both",
}

export enum ReminderPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export interface AppointmentReminderProps {
  reminderId: string;
  appointmentId: string;
  tenantId: string;
  reminderType: ReminderType;
  reminderChannel: ReminderChannel;
  scheduledAt: Date;
  sendBeforeMinutes: number;
  status: ReminderStatus;
  sentAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  subject?: string;
  message: string;
  templateId?: string;
  templateData?: Record<string, any>;
  recipientId: string;
  recipientType: RecipientType;
  recipientEmail?: string;
  recipientPhone?: string;
  priority: ReminderPriority;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AppointmentReminder Entity
 * Manages reminder lifecycle and validation
 */
export class AppointmentReminder extends Entity<AppointmentReminderProps> {
  private constructor(props: AppointmentReminderProps) {
    super(props, props.reminderId);
  }

  /**
   * Factory method to create a new reminder
   */
  public static create(
    props: Omit<
      AppointmentReminderProps,
      "reminderId" | "createdAt" | "updatedAt" | "status" | "retryCount"
    >,
  ): AppointmentReminder {
    const now = new Date();

    // Validation
    if (props.sendBeforeMinutes <= 0) {
      throw new Error("Send before minutes must be positive");
    }

    if (props.scheduledAt <= now) {
      throw new Error("Scheduled time must be in the future");
    }

    if (
      props.reminderChannel === ReminderChannel.EMAIL &&
      !props.recipientEmail
    ) {
      throw new Error("Email address required for email reminders");
    }

    if (
      props.reminderChannel === ReminderChannel.SMS &&
      !props.recipientPhone
    ) {
      throw new Error("Phone number required for SMS reminders");
    }

    const reminderProps: AppointmentReminderProps = {
      ...props,
      reminderId: crypto.randomUUID(),
      status: ReminderStatus.PENDING,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    return new AppointmentReminder(reminderProps);
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    props: AppointmentReminderProps,
  ): AppointmentReminder {
    return new AppointmentReminder(props);
  }

  // Getters
  public get reminderId(): string {
    return this.props.reminderId;
  }
  public get appointmentId(): string {
    return this.props.appointmentId;
  }
  public get tenantId(): string {
    return this.props.tenantId;
  }
  public get reminderType(): ReminderType {
    return this.props.reminderType;
  }
  public get reminderChannel(): ReminderChannel {
    return this.props.reminderChannel;
  }
  public get scheduledAt(): Date {
    return this.props.scheduledAt;
  }
  public get sendBeforeMinutes(): number {
    return this.props.sendBeforeMinutes;
  }
  public get status(): ReminderStatus {
    return this.props.status;
  }
  public get message(): string {
    return this.props.message;
  }
  public get recipientType(): RecipientType {
    return this.props.recipientType;
  }
  public get priority(): ReminderPriority {
    return this.props.priority;
  }

  /**
   * Mark reminder as sent
   */
  public markAsSent(): void {
    if (this.props.status !== ReminderStatus.PENDING) {
      throw new Error("Only pending reminders can be marked as sent");
    }
    this.props.status = ReminderStatus.SENT;
    this.props.sentAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Mark reminder as failed
   */
  public markAsFailed(reason: string): void {
    this.props.status = ReminderStatus.FAILED;
    this.props.failedAt = new Date();
    this.props.failureReason = reason;
    this.props.retryCount += 1;
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel reminder
   */
  public cancel(): void {
    if (this.props.status === ReminderStatus.SENT) {
      throw new Error("Cannot cancel already sent reminder");
    }
    this.props.status = ReminderStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if reminder can be retried
   */
  public canRetry(): boolean {
    return (
      this.props.status === ReminderStatus.FAILED &&
      this.props.retryCount < this.props.maxRetries
    );
  }

  public override validate(): void {
    if (!this.props.appointmentId) {
      throw new Error("Appointment ID is required for reminder");
    }
    if (!this.props.message || this.props.message.trim().length === 0) {
      throw new Error("Reminder message is required");
    }
    if (!this.props.recipientId) {
      throw new Error("Recipient ID is required");
    }
  }

  public override toPersistence(): AppointmentReminderProps {
    return { ...this.props };
  }
}
