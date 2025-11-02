/**
 * Reminder Service Implementation - Infrastructure Layer
 * Manages appointment reminder SCHEDULING only
 *
 * BOUNDED CONTEXT: This service only schedules reminders via scheduler-service.
 * Actual notification delivery (email/SMS/push) is handled by notifications-service.
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { IReminderService, ReminderType, ReminderChannel, ReminderSchedule, SendReminderRequest, SendReminderResponse } from '../../application/services/IReminderService';
import { ISchedulerAdapter } from '../adapters/ISchedulerAdapter';
/**
 * Reminder Policy Configuration
 * Defines which channels to use for different reminder types and priorities
 */
interface ReminderPolicy {
    [priority: string]: {
        window: string;
        channels: ReminderChannel[];
    }[];
}
/**
 * Reminder Service Implementation
 *
 * Responsibilities:
 * - Schedule reminder tasks via scheduler-service
 * - Cancel reminder tasks via scheduler-service
 *
 * NOT Responsible for:
 * - Sending actual notifications (notifications-service does this)
 * - Managing notification templates (notifications-service does this)
 * - Tracking delivery status (notifications-service does this)
 */
export declare class ReminderService implements IReminderService {
    private policy;
    private schedulerAdapter;
    constructor(schedulerAdapter: ISchedulerAdapter, customPolicy?: ReminderPolicy);
    /**
     * Schedule reminders for an appointment
     * Integrates with scheduler-service to actually schedule the tasks
     *
     * @param customWindows - Optional custom reminder windows (overrides default policy)
     */
    scheduleReminders(appointmentId: string, patientId: string, appointmentDateTime: Date, priority?: string, customWindows?: Array<{
        window: string;
        channels: ReminderChannel[];
    }>): Promise<ReminderSchedule[]>;
    /**
     * Send a reminder through specified channel
     *
     * NOTE: This method is deprecated and should not be called directly.
     * Reminders are automatically sent by scheduler-service → notifications-service.
     * This method exists only for interface compatibility.
     */
    sendReminder(request: SendReminderRequest): Promise<SendReminderResponse>;
    /**
     * Cancel all reminders for an appointment
     * Calls scheduler-service to cancel scheduled tasks
     */
    cancelReminders(appointmentId: string): Promise<void>;
    /**
     * Get pending reminders for processing
     */
    getPendingReminders(fromTime: Date, toTime: Date): Promise<ReminderSchedule[]>;
    /**
     * Mark reminder as sent
     */
    markReminderAsSent(appointmentId: string, reminderType: ReminderType, channel: ReminderChannel): Promise<void>;
    /**
     * Mark reminder as failed
     */
    markReminderAsFailed(appointmentId: string, reminderType: ReminderType, channel: ReminderChannel, error: string): Promise<void>;
    /**
     * Calculate reminder time based on window
     */
    private calculateReminderTime;
    /**
     * Convert window string to ReminderType
     */
    private windowToReminderType;
    /**
     * Reschedule reminders for a rescheduled appointment
     * Cancels old reminders and schedules new ones
     */
    rescheduleReminders(appointmentId: string, patientId: string, newAppointmentDateTime: Date, priority?: string, customWindows?: Array<{
        window: string;
        channels: ReminderChannel[];
    }>): Promise<{
        success: boolean;
        newSchedules?: ReminderSchedule[];
    }>;
    /**
     * Check scheduler service health
     */
    checkSchedulerHealth(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    /**
     * Preview reminders without actually scheduling them
     * Useful for showing users what reminders will be sent
     */
    previewReminders(appointmentDateTime: Date, priority?: string, customWindows?: Array<{
        window: string;
        channels: ReminderChannel[];
    }>): Promise<Array<{
        window: string;
        scheduledFor: Date;
        channels: ReminderChannel[];
    }>>;
}
export {};
//# sourceMappingURL=ReminderService.d.ts.map