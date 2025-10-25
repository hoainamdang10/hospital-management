/**
 * Reminder Service Implementation - Infrastructure Layer
 * Manages appointment reminders with multi-channel support
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import {
  IReminderService,
  ReminderType,
  ReminderChannel,
  ReminderStatus,
  ReminderSchedule,
  SendReminderRequest,
  SendReminderResponse,
} from '../../application/services/IReminderService';

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
 * Default Reminder Policy
 */
const DEFAULT_POLICY: ReminderPolicy = {
  ROUTINE: [
    { window: '24h', channels: [ReminderChannel.EMAIL, ReminderChannel.PUSH] },
    { window: '2h', channels: [ReminderChannel.PUSH] },
  ],
  NORMAL: [
    { window: '24h', channels: [ReminderChannel.EMAIL, ReminderChannel.PUSH] },
    { window: '2h', channels: [ReminderChannel.SMS, ReminderChannel.PUSH] },
  ],
  URGENT: [
    { window: '2h', channels: [ReminderChannel.SMS, ReminderChannel.PUSH] },
    { window: '30min', channels: [ReminderChannel.SMS, ReminderChannel.PUSH] },
  ],
  EMERGENCY: [], // No reminders for emergency appointments
};

/**
 * Reminder Service Implementation
 */
export class ReminderService implements IReminderService {
  private policy: ReminderPolicy;

  constructor(customPolicy?: ReminderPolicy) {
    this.policy = customPolicy || DEFAULT_POLICY;
  }

  /**
   * Schedule reminders for an appointment
   */
  async scheduleReminders(
    appointmentId: string,
    patientId: string,
    appointmentDateTime: Date,
    priority: string = 'NORMAL'
  ): Promise<ReminderSchedule[]> {
    const schedules: ReminderSchedule[] = [];
    const policyRules = this.policy[priority.toUpperCase()] || this.policy.NORMAL;

    for (const rule of policyRules) {
      const scheduledFor = this.calculateReminderTime(
        appointmentDateTime,
        rule.window
      );

      // Skip if reminder time is in the past
      if (scheduledFor <= new Date()) {
        console.warn(
          `[ReminderService] Skipping ${rule.window} reminder - time is in the past`
        );
        continue;
      }

      schedules.push({
        appointmentId,
        patientId,
        reminderType: this.windowToReminderType(rule.window),
        channels: rule.channels,
        scheduledFor,
        status: ReminderStatus.SCHEDULED,
      });
    }

    console.log(
      `[ReminderService] Scheduled ${schedules.length} reminders for appointment ${appointmentId}`
    );

    return schedules;
  }

  /**
   * Send a reminder through specified channel
   */
  async sendReminder(request: SendReminderRequest): Promise<SendReminderResponse> {
    try {
      switch (request.channel) {
        case ReminderChannel.EMAIL:
          return await this.sendEmailReminder(request);

        case ReminderChannel.SMS:
          return await this.sendSmsReminder(request);

        case ReminderChannel.PUSH:
          return await this.sendPushReminder(request);

        case ReminderChannel.IN_APP:
          return await this.sendInAppReminder(request);

        default:
          throw new Error(`Unsupported channel: ${request.channel}`);
      }
    } catch (error) {
      console.error(`[ReminderService] Failed to send reminder:`, error);
      return {
        success: false,
        channel: request.channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cancel all reminders for an appointment
   */
  async cancelReminders(appointmentId: string): Promise<void> {
    console.log(`[ReminderService] Cancelling all reminders for appointment ${appointmentId}`);
    // Implementation: Update reminder status in database
    // This would typically call a repository method
  }

  /**
   * Get pending reminders for processing
   */
  async getPendingReminders(
    fromTime: Date,
    toTime: Date
  ): Promise<ReminderSchedule[]> {
    // Implementation: Query database for pending reminders
    // This would typically call a repository method
    console.log(`[ReminderService] Getting pending reminders from ${fromTime} to ${toTime}`);
    return [];
  }

  /**
   * Mark reminder as sent
   */
  async markReminderAsSent(
    appointmentId: string,
    reminderType: ReminderType,
    channel: ReminderChannel
  ): Promise<void> {
    console.log(
      `[ReminderService] Marking reminder as sent: ${appointmentId} - ${reminderType} - ${channel}`
    );
    // Implementation: Update reminder status in database
  }

  /**
   * Mark reminder as failed
   */
  async markReminderAsFailed(
    appointmentId: string,
    reminderType: ReminderType,
    channel: ReminderChannel,
    error: string
  ): Promise<void> {
    console.error(
      `[ReminderService] Marking reminder as failed: ${appointmentId} - ${reminderType} - ${channel} - ${error}`
    );
    // Implementation: Update reminder status and log error
  }

  // ==================== Private Helper Methods ====================

  /**
   * Calculate reminder time based on window
   */
  private calculateReminderTime(appointmentDateTime: Date, window: string): Date {
    const match = window.match(/^(\d+)(min|h|d)$/);
    if (!match) {
      throw new Error(`Invalid window format: ${window}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const reminderTime = new Date(appointmentDateTime);

    switch (unit) {
      case 'min':
        reminderTime.setMinutes(reminderTime.getMinutes() - value);
        break;
      case 'h':
        reminderTime.setHours(reminderTime.getHours() - value);
        break;
      case 'd':
        reminderTime.setDate(reminderTime.getDate() - value);
        break;
    }

    return reminderTime;
  }

  /**
   * Convert window string to ReminderType
   */
  private windowToReminderType(window: string): ReminderType {
    switch (window) {
      case '24h':
        return ReminderType.BEFORE_24H;
      case '2h':
        return ReminderType.BEFORE_2H;
      case '30min':
        return ReminderType.BEFORE_30MIN;
      default:
        return ReminderType.BEFORE_2H;
    }
  }

  /**
   * Send email reminder
   */
  private async sendEmailReminder(
    request: SendReminderRequest
  ): Promise<SendReminderResponse> {
    if (!request.patientEmail) {
      return {
        success: false,
        channel: ReminderChannel.EMAIL,
        error: 'Patient email not provided',
      };
    }

    console.log(`[ReminderService] Sending email reminder to ${request.patientEmail}`);

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // For now, just log
    const emailContent = this.generateEmailContent(request);
    console.log('Email content:', emailContent);

    return {
      success: true,
      channel: ReminderChannel.EMAIL,
      sentAt: new Date(),
    };
  }

  /**
   * Send SMS reminder
   */
  private async sendSmsReminder(
    request: SendReminderRequest
  ): Promise<SendReminderResponse> {
    if (!request.patientPhone) {
      return {
        success: false,
        channel: ReminderChannel.SMS,
        error: 'Patient phone not provided',
      };
    }

    console.log(`[ReminderService] Sending SMS reminder to ${request.patientPhone}`);

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    const smsContent = this.generateSmsContent(request);
    console.log('SMS content:', smsContent);

    return {
      success: true,
      channel: ReminderChannel.SMS,
      sentAt: new Date(),
    };
  }

  /**
   * Send push notification reminder
   */
  private async sendPushReminder(
    request: SendReminderRequest
  ): Promise<SendReminderResponse> {
    console.log(`[ReminderService] Sending push reminder for patient ${request.patientId}`);

    // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)
    const pushContent = this.generatePushContent(request);
    console.log('Push content:', pushContent);

    return {
      success: true,
      channel: ReminderChannel.PUSH,
      sentAt: new Date(),
    };
  }

  /**
   * Send in-app notification reminder
   */
  private async sendInAppReminder(
    request: SendReminderRequest
  ): Promise<SendReminderResponse> {
    console.log(`[ReminderService] Creating in-app reminder for patient ${request.patientId}`);

    // TODO: Store in-app notification in database
    return {
      success: true,
      channel: ReminderChannel.IN_APP,
      sentAt: new Date(),
    };
  }

  /**
   * Generate email content
   */
  private generateEmailContent(request: SendReminderRequest): string {
    const timeWindow = request.reminderType === ReminderType.BEFORE_24H ? '24 giờ' :
                       request.reminderType === ReminderType.BEFORE_2H ? '2 giờ' : '30 phút';

    return `
      Kính gửi ${request.patientName},

      Đây là lời nhắc về cuộc hẹn khám bệnh của bạn trong ${timeWindow} tới:

      📅 Ngày: ${request.appointmentDate}
      🕐 Giờ: ${request.appointmentTime}
      👨‍⚕️ Bác sĩ: ${request.doctorName}

      Vui lòng đến đúng giờ. Nếu cần hủy hoặc thay đổi lịch hẹn, vui lòng liên hệ với chúng tôi.

      Trân trọng,
      Bệnh viện
    `;
  }

  /**
   * Generate SMS content
   */
  private generateSmsContent(request: SendReminderRequest): string {
    const timeWindow = request.reminderType === ReminderType.BEFORE_24H ? '24h' :
                       request.reminderType === ReminderType.BEFORE_2H ? '2h' : '30 phút';

    return `Nhắc lịch hẹn: ${request.appointmentDate} ${request.appointmentTime} - BS ${request.doctorName}. Còn ${timeWindow}.`;
  }

  /**
   * Generate push notification content
   */
  private generatePushContent(request: SendReminderRequest): {
    title: string;
    body: string;
  } {
    const timeWindow = request.reminderType === ReminderType.BEFORE_24H ? '24 giờ' :
                       request.reminderType === ReminderType.BEFORE_2H ? '2 giờ' : '30 phút';

    return {
      title: 'Nhắc nhở cuộc hẹn',
      body: `Cuộc hẹn với ${request.doctorName} sẽ diễn ra trong ${timeWindow}`,
    };
  }
}

