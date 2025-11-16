/**
 * AppointmentReminder Aggregate Root
 * Represents an appointment reminder schedule in the domain
 * Refactored to match project architecture patterns
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
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
export declare class AppointmentReminder extends HealthcareAggregateRoot<AppointmentReminderProps> {
    private constructor();
    /**
     * Factory method to create a new reminder
     */
    static create(props: AppointmentReminderProps, id?: string): AppointmentReminder;
    get reminderId(): string;
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
    markAsProcessing(): void;
    /**
     * Mark as sent
     */
    markAsSent(notificationId: string): void;
    /**
     * Mark as failed
     */
    markAsFailed(reason: string): void;
    /**
     * Cancel reminder
     */
    cancel(reason: string, cancelledBy: string): void;
    /**
     * Mark as expired (past appointment date)
     */
    markAsExpired(): void;
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
    getPatientId(): string | null;
    protected validateBusinessInvariants(): void;
    protected applyEvent(event: DomainEvent): void;
    validate(): void;
    toPersistence(): any;
}
//# sourceMappingURL=AppointmentReminder.d.ts.map