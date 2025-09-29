/**
 * SendNotificationUseCase - Application Use Case
 * Use case for sending notifications with Vietnamese healthcare context
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

export interface SendNotificationCommand {
  recipientId: string;
  recipientType: string;
  templateType: TemplateType;
  templateData: Record<string, any>;
  channels?: string[];
  priority?: NotificationPriority;
  scheduledAt?: Date;
  expiresAt?: Date;
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

export interface SendNotificationResult {
  notificationId: string;
  status: 'SCHEDULED' | 'SENT' | 'FAILED';
  scheduledAt: Date;
  channels: string[];
  message: string;
  deliveryResults?: Array<{
    channel: string;
    status: string;
    deliveredAt?: Date;
    errorMessage?: string;
  }>;
}

export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateService: ITemplateService,
    private readonly deliveryService: IDeliveryService
  ) {}

  /**
   * Execute send notification use case
   */
  public async execute(command: SendNotificationCommand): Promise<SendNotificationResult> {
    try {
      // Validate command
      this.validateCommand(command);

      // Get recipient information
      const recipient = await this.getRecipientInfo(command.recipientId, command.recipientType);

      // Get and apply template
      const template = await this.templateService.getTemplateByType(
        command.templateType,
        recipient.getPreferredLanguage()
      );

      if (!template) {
        throw new Error(`Không tìm thấy template cho loại thông báo: ${command.templateType}`);
      }

      // Apply template with data
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

      // Create notification aggregate
      const notification = NotificationAggregate.create({
        recipient,
        template,
        content,
        channels,
        priority: command.priority || 'NORMAL',
        scheduledAt: command.scheduledAt,
        expiresAt: command.expiresAt,
        metadata: command.metadata
      });

      // Check for duplicates
      await this.checkForDuplicates(notification);

      // Schedule notification
      notification.schedule();

      // Save notification
      await this.notificationRepository.save(notification);

      // If scheduled for immediate delivery, process it
      if (notification.isReadyForProcessing()) {
        return await this.processImmediateDelivery(notification);
      }

      // Return scheduled result
      return {
        notificationId: notification.getId().getValue(),
        status: 'SCHEDULED',
        scheduledAt: notification.getScheduledAt(),
        channels: channels.map(c => c.getType()),
        message: `Đã lên lịch gửi thông báo ${command.templateType} cho ${command.recipientType} qua ${channels.length} kênh`
      };

    } catch (error) {
      throw new Error(`Lỗi khi gửi thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Validate send notification command
   */
  private validateCommand(command: SendNotificationCommand): void {
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

    // Validate scheduled time
    if (command.scheduledAt && command.scheduledAt < new Date()) {
      throw new Error('Thời gian lên lịch không thể trong quá khứ');
    }

    // Validate expiration time
    if (command.expiresAt && command.scheduledAt && command.expiresAt <= command.scheduledAt) {
      throw new Error('Thời gian hết hạn phải sau thời gian lên lịch');
    }

    // Validate healthcare context for healthcare notifications
    if (this.isHealthcareNotification(command.templateType)) {
      if (!command.metadata?.healthcareContext) {
        throw new Error('Thông báo y tế phải có thông tin bối cảnh healthcare');
      }
    }
  }

  /**
   * Get recipient information
   */
  private async getRecipientInfo(recipientId: string, recipientType: string): Promise<RecipientInfo> {
    // This would typically call another service to get recipient details
    // For now, we'll create a basic recipient info
    // In real implementation, this would integrate with Patient/Doctor/Staff services

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
    const availableChannels = channels.filter(channel => 
      recipient.canReceiveOnChannel(channel.getType())
    );

    // For urgent healthcare notifications, ensure at least SMS or Voice
    if (priority === 'URGENT' && this.isHealthcareRecipient(recipient)) {
      const hasUrgentChannel = availableChannels.some(channel => 
        channel.getType() === 'SMS' || channel.getType() === 'VOICE'
      );

      if (!hasUrgentChannel && recipient.canReceiveOnChannel('SMS')) {
        availableChannels.push(NotificationChannel.createSMS({ priority: 1 }));
      }
    }

    return availableChannels;
  }

  /**
   * Check for duplicate notifications
   */
  private async checkForDuplicates(notification: NotificationAggregate): Promise<void> {
    const duplicates = await this.notificationRepository.findDuplicates(
      notification.getRecipient().getRecipientId(),
      notification.getTemplate().getTemplateType(),
      notification.getContent().getContentHash(),
      1 // Within 1 hour
    );

    if (duplicates.length > 0) {
      const recentDuplicate = duplicates.find(dup => 
        dup.getStatus() === 'SENT' || dup.getStatus() === 'SCHEDULED'
      );

      if (recentDuplicate) {
        throw new Error('Thông báo tương tự đã được gửi trong vòng 1 giờ qua');
      }
    }
  }

  /**
   * Process immediate delivery
   */
  private async processImmediateDelivery(notification: NotificationAggregate): Promise<SendNotificationResult> {
    try {
      // Start processing
      notification.startProcessing();
      await this.notificationRepository.update(notification);

      // Create delivery request
      const deliveryRequest = {
        notificationId: notification.getId().getValue(),
        recipient: notification.getRecipient(),
        content: notification.getContent(),
        channels: notification.getChannels(),
        priority: notification.getPriority(),
        metadata: {
          correlationId: notification.getMetadata().correlationId,
          userId: notification.getMetadata().userId,
          sessionId: notification.getMetadata().sessionId,
          healthcareContext: notification.getMetadata().healthcareContext
        }
      };

      // Deliver notification
      const deliveryResults = await this.deliveryService.deliver(deliveryRequest);

      // Update notification with results
      notification.markAsSent(deliveryResults);
      await this.notificationRepository.update(notification);

      // Return result
      return {
        notificationId: notification.getId().getValue(),
        status: notification.getStatus() as 'SENT' | 'FAILED',
        scheduledAt: notification.getScheduledAt(),
        channels: notification.getChannels().map(c => c.getType()),
        message: this.getDeliveryMessage(notification, deliveryResults),
        deliveryResults: deliveryResults.map(result => ({
          channel: result.channel,
          status: result.status,
          deliveredAt: result.deliveredAt,
          errorMessage: result.failureReason
        }))
      };

    } catch (error) {
      // Mark as failed
      const channelFailures = notification.getChannels().map(channel => ({
        channel: channel.getType(),
        reason: 'UNKNOWN_ERROR' as const,
        errorMessage: error instanceof Error ? error.message : 'Lỗi không xác định',
        attemptedAt: new Date(),
        retryable: true
      }));

      notification.markAsFailed(channelFailures);
      await this.notificationRepository.update(notification);

      return {
        notificationId: notification.getId().getValue(),
        status: 'FAILED',
        scheduledAt: notification.getScheduledAt(),
        channels: notification.getChannels().map(c => c.getType()),
        message: `Gửi thông báo thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
      };
    }
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

  private isHealthcareRecipient(recipient: RecipientInfo): boolean {
    const healthcareTypes = ['PATIENT', 'DOCTOR', 'STAFF'];
    return healthcareTypes.includes(recipient.getRecipientType());
  }

  private getDeliveryMessage(notification: NotificationAggregate, deliveryResults: any[]): string {
    const successCount = deliveryResults.filter(r => r.status === 'SENT' || r.status === 'DELIVERED').length;
    const totalCount = deliveryResults.length;

    if (successCount === totalCount) {
      return `Đã gửi thành công thông báo qua ${successCount} kênh`;
    } else if (successCount > 0) {
      return `Đã gửi thành công qua ${successCount}/${totalCount} kênh`;
    } else {
      return 'Gửi thông báo thất bại trên tất cả các kênh';
    }
  }
}
