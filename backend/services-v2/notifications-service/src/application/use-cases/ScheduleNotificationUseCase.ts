/**
 * ScheduleNotificationUseCase - Application Use Case
 * Use case for scheduling notifications for future delivery
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Vietnamese Healthcare Standards
 */

import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { ITemplateService } from '../../domain/services/ITemplateService';
import { IDeliveryService } from '../../domain/services/IDeliveryService';
import { NotificationAggregate, NotificationPriority } from '../../domain/aggregates/NotificationAggregate';
import { RecipientInfo } from '../../domain/value-objects/RecipientInfo';
import { NotificationChannel } from '../../domain/value-objects/NotificationChannel';
import { TemplateType } from '../../domain/value-objects/NotificationTemplate';

export interface ScheduleNotificationCommand {
  recipientId: string;
  recipientType: string;
  templateType: TemplateType;
  templateData: Record<string, any>;
  scheduledAt: Date;
  channels?: string[];
  priority?: NotificationPriority;
  expiresAt?: Date;
  recurrence?: {
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    interval: number;
    endDate?: Date;
    maxOccurrences?: number;
  };
  metadata?: {
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    source?: string;
    tags?: string[];
    healthcareContext?: {
      patientId?: string;
      doctorId?: string;
      appointmentId?: string;
      medicalRecordId?: string;
      departmentId?: string;
    };
  };
}

export interface ScheduleNotificationResult {
  notificationId: string;
  scheduledAt: Date;
  expiresAt?: Date;
  channels: string[];
  status: 'SCHEDULED';
  message: string;
  recurrenceSchedule?: Array<{
    notificationId: string;
    scheduledAt: Date;
  }>;
}

export class ScheduleNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateService: ITemplateService,
    private readonly deliveryService: IDeliveryService
  ) {}

  /**
   * Execute schedule notification use case
   */
  public async execute(command: ScheduleNotificationCommand): Promise<ScheduleNotificationResult> {
    try {
      // Validate command
      this.validateCommand(command);

      // Get recipient information
      const recipient = await this.getRecipientInfo(command.recipientId, command.recipientType);

      // Get and validate template
      const template = await this.templateService.getTemplateByType(
        command.templateType,
        recipient.getPreferredLanguage()
      );

      if (!template) {
        throw new Error(`Không tìm thấy template cho loại thông báo: ${command.templateType}`);
      }

      // Apply template with data to validate
      const content = await this.templateService.applyTemplateByType(
        command.templateType,
        command.templateData,
        recipient.getPreferredLanguage()
      );

      // Determine delivery channels
      const channels = await this.determineDeliveryChannels(
        command.channels,
        recipient,
        command.priority || 'NORMAL'
      );

      if (channels.length === 0) {
        throw new Error('Không có kênh gửi thông báo khả dụng cho người nhận này');
      }

      // Adjust scheduled time for recipient preferences
      const adjustedScheduledAt = this.adjustScheduledTime(command.scheduledAt, recipient, command.priority);

      // Create main notification
      const notification = NotificationAggregate.create({
        recipient,
        template,
        content,
        channels,
        priority: command.priority || 'NORMAL',
        scheduledAt: adjustedScheduledAt,
        expiresAt: command.expiresAt,
        metadata: command.metadata
      });

      // Schedule notification
      notification.schedule();

      // Save notification
      await this.notificationRepository.save(notification);

      let recurrenceSchedule: Array<{ notificationId: string; scheduledAt: Date }> | undefined;

      // Handle recurrence if specified
      if (command.recurrence) {
        recurrenceSchedule = await this.scheduleRecurringNotifications(
          command,
          recipient,
          template,
          channels,
          adjustedScheduledAt
        );
      }

      return {
        notificationId: notification.getId().getValue(),
        scheduledAt: notification.getScheduledAt(),
        expiresAt: notification.getExpiresAt(),
        channels: channels.map(c => c.getType()),
        status: 'SCHEDULED',
        message: this.getScheduleMessage(command, channels.length, recurrenceSchedule?.length),
        recurrenceSchedule
      };

    } catch (error) {
      throw new Error(`Lỗi khi lên lịch thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Validate schedule notification command
   */
  private validateCommand(command: ScheduleNotificationCommand): void {
    if (!command.recipientId?.trim()) {
      throw new Error('Mã người nhận không được để trống');
    }

    if (!command.recipientType?.trim()) {
      throw new Error('Loại người nhận không được để trống');
    }

    if (!command.templateType?.trim()) {
      throw new Error('Loại template không được để trống');
    }

    if (!command.templateData || Object.keys(command.templateData).length === 0) {
      throw new Error('Dữ liệu template không được để trống');
    }

    if (!command.scheduledAt) {
      throw new Error('Thời gian lên lịch không được để trống');
    }

    // Validate scheduled time is in the future
    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 60000); // At least 1 minute in future

    if (command.scheduledAt < minScheduleTime) {
      throw new Error('Thời gian lên lịch phải ít nhất 1 phút trong tương lai');
    }

    // Validate expiration time
    if (command.expiresAt && command.expiresAt <= command.scheduledAt) {
      throw new Error('Thời gian hết hạn phải sau thời gian lên lịch');
    }

    // Validate recurrence settings
    if (command.recurrence) {
      this.validateRecurrenceSettings(command.recurrence, command.scheduledAt);
    }

    // Validate healthcare context for healthcare notifications
    if (this.isHealthcareNotification(command.templateType)) {
      if (!command.metadata?.healthcareContext) {
        throw new Error('Thông báo y tế phải có thông tin bối cảnh healthcare');
      }
    }
  }

  /**
   * Validate recurrence settings
   */
  private validateRecurrenceSettings(
    recurrence: NonNullable<ScheduleNotificationCommand['recurrence']>,
    scheduledAt: Date
  ): void {
    if (recurrence.interval <= 0) {
      throw new Error('Khoảng cách lặp lại phải lớn hơn 0');
    }

    if (recurrence.interval > 365) {
      throw new Error('Khoảng cách lặp lại không được vượt quá 365');
    }

    if (recurrence.endDate && recurrence.endDate <= scheduledAt) {
      throw new Error('Ngày kết thúc lặp lại phải sau thời gian lên lịch');
    }

    if (recurrence.maxOccurrences && recurrence.maxOccurrences <= 0) {
      throw new Error('Số lần lặp lại tối đa phải lớn hơn 0');
    }

    if (recurrence.maxOccurrences && recurrence.maxOccurrences > 1000) {
      throw new Error('Số lần lặp lại tối đa không được vượt quá 1000');
    }

    // Validate end conditions
    if (!recurrence.endDate && !recurrence.maxOccurrences) {
      throw new Error('Phải chỉ định ngày kết thúc hoặc số lần lặp lại tối đa');
    }
  }

  /**
   * Get recipient information
   */
  private async getRecipientInfo(recipientId: string, recipientType: string): Promise<RecipientInfo> {
    try {
      // Mock recipient data - in real implementation, this would come from other services
      const mockRecipientData = {
        recipientId,
        recipientType: recipientType as any,
        fullName: `Người nhận ${recipientId}`,
        contactInfo: {
          email: `${recipientId}@hospital.com`,
          phoneNumber: '0901234567'
        },
        preferences: {
          preferredChannels: ['EMAIL', 'SMS', 'PUSH'],
          timezone: 'Asia/Ho_Chi_Minh',
          language: 'vi' as const,
          quietHours: {
            start: '22:00',
            end: '07:00'
          },
          optOut: {
            marketing: false,
            reminders: false,
            emergency: false
          }
        },
        healthcareContext: {
          emergencyContact: false,
          hipaaAuthorized: true
        }
      };

      return RecipientInfo.create(mockRecipientData);
    } catch (error) {
      throw new Error(`Không thể lấy thông tin người nhận: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Determine optimal delivery channels
   */
  private async determineDeliveryChannels(
    requestedChannels: string[] | undefined,
    recipient: RecipientInfo,
    priority: NotificationPriority
  ): Promise<NotificationChannel[]> {
    let channels: NotificationChannel[] = [];

    if (requestedChannels && requestedChannels.length > 0) {
      // Use requested channels
      channels = requestedChannels.map(channelType => {
        switch (channelType.toUpperCase()) {
          case 'EMAIL':
            return NotificationChannel.createEmail();
          case 'SMS':
            return NotificationChannel.createSMS();
          case 'PUSH':
            return NotificationChannel.createPush();
          case 'IN_APP':
            return NotificationChannel.createInApp();
          case 'VOICE':
            return NotificationChannel.createVoice();
          default:
            throw new Error(`Kênh gửi không được hỗ trợ: ${channelType}`);
        }
      });
    } else {
      // Use optimal channels based on priority and recipient preferences
      channels = await this.deliveryService.getOptimalChannels(recipient, priority);
    }

    // Filter channels based on recipient's ability to receive
    return channels.filter(channel => 
      recipient.canReceiveOnChannel(channel.getType())
    );
  }

  /**
   * Adjust scheduled time based on recipient preferences
   */
  private adjustScheduledTime(
    scheduledAt: Date,
    recipient: RecipientInfo,
    priority?: NotificationPriority
  ): Date {
    // Don't adjust for urgent notifications
    if (priority === 'URGENT') {
      return scheduledAt;
    }

    // Check if scheduled time falls within quiet hours
    if (recipient.isInQuietHours(scheduledAt)) {
      const quietHours = recipient.getPreferences().quietHours;
      if (quietHours) {
        const [endHour, endMinute] = quietHours.end.split(':').map(Number);
        
        const adjustedTime = new Date(scheduledAt);
        adjustedTime.setHours(endHour, endMinute, 0, 0);
        
        // If end time is before scheduled time (next day), add a day
        if (adjustedTime <= scheduledAt) {
          adjustedTime.setDate(adjustedTime.getDate() + 1);
        }
        
        return adjustedTime;
      }
    }

    return scheduledAt;
  }

  /**
   * Schedule recurring notifications
   */
  private async scheduleRecurringNotifications(
    command: ScheduleNotificationCommand,
    recipient: RecipientInfo,
    template: any,
    channels: NotificationChannel[],
    baseScheduledAt: Date
  ): Promise<Array<{ notificationId: string; scheduledAt: Date }>> {
    const recurrence = command.recurrence!;
    const recurringNotifications: Array<{ notificationId: string; scheduledAt: Date }> = [];
    
    let currentDate = new Date(baseScheduledAt);
    let occurrenceCount = 0;
    const maxOccurrences = recurrence.maxOccurrences || 1000;

    while (occurrenceCount < maxOccurrences) {
      // Calculate next occurrence
      currentDate = this.calculateNextOccurrence(currentDate, recurrence.type, recurrence.interval);
      
      // Check end date
      if (recurrence.endDate && currentDate > recurrence.endDate) {
        break;
      }

      // Check maximum occurrences
      if (occurrenceCount >= maxOccurrences) {
        break;
      }

      // Adjust for recipient preferences
      const adjustedScheduledAt = this.adjustScheduledTime(currentDate, recipient, command.priority);

      // Apply template with updated data (might include occurrence-specific data)
      const content = await this.templateService.applyTemplateByType(
        command.templateType,
        {
          ...command.templateData,
          occurrenceNumber: occurrenceCount + 2, // +2 because first is base, this is second, etc.
          scheduledDate: adjustedScheduledAt
        },
        recipient.getPreferredLanguage()
      );

      // Create recurring notification
      const recurringNotification = NotificationAggregate.create({
        recipient,
        template,
        content,
        channels,
        priority: command.priority || 'NORMAL',
        scheduledAt: adjustedScheduledAt,
        expiresAt: command.expiresAt,
        metadata: {
          ...command.metadata,
          tags: [...(command.metadata?.tags || []), 'recurring', `occurrence-${occurrenceCount + 2}`]
        }
      });

      // Schedule recurring notification
      recurringNotification.schedule();

      // Save recurring notification
      await this.notificationRepository.save(recurringNotification);

      recurringNotifications.push({
        notificationId: recurringNotification.getId().getValue(),
        scheduledAt: recurringNotification.getScheduledAt()
      });

      occurrenceCount++;
    }

    return recurringNotifications;
  }

  /**
   * Calculate next occurrence date
   */
  private calculateNextOccurrence(
    currentDate: Date,
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    interval: number
  ): Date {
    const nextDate = new Date(currentDate);

    switch (type) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + (interval * 7));
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
    }

    return nextDate;
  }

  /**
   * Helper methods
   */
  private isHealthcareNotification(templateType: TemplateType): boolean {
    const healthcareTypes: TemplateType[] = [
      'APPOINTMENT_REMINDER',
      'APPOINTMENT_CONFIRMATION',
      'APPOINTMENT_CANCELLATION',
      'TEST_RESULT_READY',
      'MEDICATION_REMINDER'
    ];

    return healthcareTypes.includes(templateType);
  }

  private getScheduleMessage(
    command: ScheduleNotificationCommand,
    channelCount: number,
    recurrenceCount?: number
  ): string {
    const baseMessage = `Đã lên lịch thông báo ${command.templateType} cho ${command.recipientType} qua ${channelCount} kênh`;
    
    if (recurrenceCount && recurrenceCount > 0) {
      return `${baseMessage} với ${recurrenceCount} lần lặp lại`;
    }

    return baseMessage;
  }
}
