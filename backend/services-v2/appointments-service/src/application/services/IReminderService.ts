/**
 * Reminder Service Interface - Application Layer
 * Manages appointment reminders across multiple channels
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

export enum ReminderType {
  BEFORE_24H = '24h',
  BEFORE_2H = '2h',
  BEFORE_30MIN = '30min',
}

export enum ReminderChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum ReminderStatus {
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface ReminderSchedule {
  appointmentId: string;
  patientId: string;
  reminderType: ReminderType;
  channels: ReminderChannel[];
  scheduledFor: Date;
  status: ReminderStatus;
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
 * Reminder Service Interface
 * Handles scheduling and sending appointment reminders
 */
export interface IReminderService {
  /**
   * Schedule reminders for an appointment
   * Creates reminder tasks for 24h, 2h, and 30min before appointment
   */
  scheduleReminders(
    appointmentId: string,
    patientId: string,
    appointmentDateTime: Date,
    priority: string
  ): Promise<ReminderSchedule[]>;

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
  getPendingReminders(
    fromTime: Date,
    toTime: Date
  ): Promise<ReminderSchedule[]>;

  /**
   * Mark reminder as sent
   */
  markReminderAsSent(
    appointmentId: string,
    reminderType: ReminderType,
    channel: ReminderChannel
  ): Promise<void>;

  /**
   * Mark reminder as failed
   */
  markReminderAsFailed(
    appointmentId: string,
    reminderType: ReminderType,
    channel: ReminderChannel,
    error: string
  ): Promise<void>;
}

