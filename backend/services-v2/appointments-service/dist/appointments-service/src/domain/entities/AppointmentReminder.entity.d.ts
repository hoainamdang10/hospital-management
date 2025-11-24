/**
 * AppointmentReminder Entity - Domain Layer
 * Represents a MANUALLY CREATED reminder for an appointment
 *
 * ⚠️ ARCHITECTURE NOTE: ALTERNATIVE APPROACH ⚠️
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
import { Entity } from "../../../../shared/domain/base/entity";
export declare enum ReminderType {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
    IN_APP = "in_app"
}
export declare enum ReminderChannel {
    EMAIL = "email",
    SMS = "sms",
    PUSH_NOTIFICATION = "push_notification",
    IN_APP_NOTIFICATION = "in_app_notification"
}
export declare enum ReminderStatus {
    PENDING = "pending",
    SENT = "sent",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum RecipientType {
    PATIENT = "patient",
    DOCTOR = "doctor",
    BOTH = "both"
}
export declare enum ReminderPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
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
export declare class AppointmentReminder extends Entity<AppointmentReminderProps> {
    private constructor();
    /**
     * Factory method to create a new reminder
     */
    static create(props: Omit<AppointmentReminderProps, "reminderId" | "createdAt" | "updatedAt" | "status" | "retryCount">): AppointmentReminder;
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props: AppointmentReminderProps): AppointmentReminder;
    get reminderId(): string;
    get appointmentId(): string;
    get tenantId(): string;
    get reminderType(): ReminderType;
    get reminderChannel(): ReminderChannel;
    get scheduledAt(): Date;
    get sendBeforeMinutes(): number;
    get status(): ReminderStatus;
    get message(): string;
    get recipientType(): RecipientType;
    get priority(): ReminderPriority;
    /**
     * Mark reminder as sent
     */
    markAsSent(): void;
    /**
     * Mark reminder as failed
     */
    markAsFailed(reason: string): void;
    /**
     * Cancel reminder
     */
    cancel(): void;
    /**
     * Check if reminder can be retried
     */
    canRetry(): boolean;
    validate(): void;
    toPersistence(): AppointmentReminderProps;
}
//# sourceMappingURL=AppointmentReminder.entity.d.ts.map