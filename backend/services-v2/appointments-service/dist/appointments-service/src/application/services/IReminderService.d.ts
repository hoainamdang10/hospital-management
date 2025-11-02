/**
 * Reminder Service Interface - Application Layer
 * Manages appointment reminders across multiple channels
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
export declare enum ReminderType {
    BEFORE_24H = "24h",
    BEFORE_2H = "2h",
    BEFORE_30MIN = "30min"
}
export declare enum ReminderChannel {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
    IN_APP = "in_app"
}
export declare enum ReminderStatus {
    SCHEDULED = "scheduled",
    SENT = "sent",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface ReminderSchedule {
    appointmentId: string;
    patientId: string;
    reminderType: ReminderType;
    channels: ReminderChannel[];
    scheduledFor: Date;
    status: ReminderStatus;
    window: string;
}
export interface SendReminderRequest {
    appointmentId: string;
    patientId: string;
    patientName: string;
    patientEmail?: string;
    patientPhone?: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    channel: ReminderChannel;
    reminderType: ReminderType;
}
export interface SendReminderResponse {
    success: boolean;
    channel: ReminderChannel;
    sentAt?: Date;
    error?: string;
}
/**
 * Custom reminder window configuration
 */
export interface CustomReminderWindow {
    window: string;
    channels: ReminderChannel[];
}
/**
 * Reminder Service Interface
 * Handles scheduling and sending appointment reminders
 */
export interface IReminderService {
    /**
     * Schedule reminders for an appointment
     * Creates reminder tasks for 24h, 2h, and 30min before appointment (default)
     * or uses custom windows if provided
     *
     * @param appointmentId - Appointment ID
     * @param patientId - Patient ID
     * @param appointmentDateTime - Appointment date and time
     * @param priority - Appointment priority
     * @param customWindows - Optional custom reminder windows (overrides default policy)
     */
    scheduleReminders(appointmentId: string, patientId: string, appointmentDateTime: Date, priority: string, customWindows?: CustomReminderWindow[]): Promise<ReminderSchedule[]>;
    /**
     * Send a reminder through specified channel
     */
    sendReminder(request: SendReminderRequest): Promise<SendReminderResponse>;
    /**
     * Cancel all reminders for an appointment
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
}
//# sourceMappingURL=IReminderService.d.ts.map