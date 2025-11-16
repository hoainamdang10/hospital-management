/**
 * AppointmentReminder Aggregate Root
 * Represents an appointment reminder schedule in the domain
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { AggregateRoot } from '@shared/domain/base/AggregateRoot';
import { Result } from '@shared/core/Result';
import { UniqueEntityID } from '@shared/domain/base/UniqueEntityID';
import { ReminderType } from '../value-objects/ReminderType';
import { ReminderStatus } from '../value-objects/ReminderStatus';
export interface AppointmentReminderProps {
    appointmentId: string;
    tenantId: string;
    patientId: string;
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
    patientLanguage?: string;
    doctorId?: string;
    doctorName?: string;
    doctorSpecialization?: string;
    appointmentDate: Date;
    appointmentTime: string;
    appointmentType?: string;
    reason?: string;
    reminderType: ReminderType;
    scheduledSendTime: Date;
    status: ReminderStatus;
    channels?: string[];
    preferredChannel?: string;
    notificationId?: string;
    sentAt?: Date;
    deliveredAt?: Date;
    failedAt?: Date;
    failureReason?: string;
    retryCount?: number;
    maxRetries?: number;
    lastRetryAt?: Date;
    nextRetryAt?: Date;
    templateId?: string;
    templateData?: Record<string, any>;
    customMessage?: string;
    cancelledAt?: Date;
    cancelledBy?: string;
    cancellationReason?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string;
}
export declare class AppointmentReminder extends AggregateRoot<AppointmentReminderProps> {
    private constructor();
    /**
     * Factory method to create a new reminder
     */
    static create(props: AppointmentReminderProps, id?: UniqueEntityID): Result<AppointmentReminder>;
    get reminderId(): UniqueEntityID;
    get appointmentId(): string;
    get tenantId(): string;
    get patientId(): string;
    get patientName(): string | undefined;
    get patientPhone(): string | undefined;
    get patientEmail(): string | undefined;
    get doctorName(): string | undefined;
    get appointmentDate(): Date;
    get appointmentTime(): string;
    get reminderType(): ReminderType;
    get scheduledSendTime(): Date;
    get status(): ReminderStatus;
    get notificationId(): string | undefined;
    get sentAt(): Date | undefined;
    get retryCount(): number;
    get maxRetries(): number;
    get templateData(): Record<string, any>;
    /**
     * Check if reminder is due to be sent
     */
    isDue(currentTime?: Date): boolean;
    /**
     * Check if reminder can be retried
     */
    canRetry(): boolean;
    /**
     * Mark as processing
     */
    markAsProcessing(): Result<void>;
    /**
     * Mark as sent
     */
    markAsSent(notificationId: string): Result<void>;
    /**
     * Mark as failed
     */
    markAsFailed(reason: string): Result<void>;
    /**
     * Cancel reminder
     */
    cancel(reason: string, cancelledBy: string): Result<void>;
    /**
     * Mark as expired (past appointment date)
     */
    markAsExpired(): Result<void>;
    /**
     * Get template variables for reminder message
     */
    getTemplateVariables(): Record<string, any>;
    /**
     * Format date for Vietnamese locale
     */
    private formatDate;
    /**
     * Get appointment date time
     */
    getAppointmentDateTime(): Date;
    /**
     * Check if appointment is in the past
     */
    isAppointmentPast(currentTime?: Date): boolean;
}
//# sourceMappingURL=AppointmentReminder.d.ts.map