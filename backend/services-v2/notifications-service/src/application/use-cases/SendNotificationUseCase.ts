/**
 * SendNotificationUseCase - Simplified for Scheduler Integration
 * Nhận command từ Scheduler Service và gửi notification ngay lập tức
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Scheduler Integration
 */

import { Notification } from "../../domain/aggregates/Notification";
import { RecipientInfo } from "../../domain/value-objects/RecipientInfo";
import { NotificationChannel } from "../../domain/value-objects/NotificationChannel";
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { ITemplateService, TemplateType } from "../../domain/services/ITemplateService";
import { IDeliveryService, DeliveryResult } from "../../domain/services/IDeliveryService";

export interface SendNotificationCommand {
  recipientId: string;
  recipientType: "PATIENT" | "DOCTOR" | "NURSE" | "ADMIN";
  templateType: string;
  templateData: Record<string, any>;
  channels: string[];
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  metadata?: {
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    source?: string;
    healthcareContext?: {
      patientId?: string;
      doctorId?: string;
      appointmentId?: string;
      medicalRecordId?: string;
    };
  };
}

export interface SendNotificationResult {
  notificationId: string;
  status: "SENT" | "FAILED";
  deliveryResults: DeliveryResult[];
  sentAt?: Date;
  message: string;
}

export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateService: ITemplateService,
    private readonly deliveryService: IDeliveryService
  ) {}

  async execute(command: SendNotificationCommand): Promise<SendNotificationResult> {
    try {
      const recipient = await this.getRecipientInfo(command.recipientId, command.recipientType);
      const content = await this.templateService.applyTemplateByType(
        command.templateType as TemplateType,
        command.templateData,
        recipient.getPreferredLanguage()
      );
      const channels = this.determineChannels(command.channels, recipient);

      const notification = Notification.create({
        recipient,
        templateType: command.templateType,
        content,
        channels,
        priority: command.priority || "NORMAL",
        metadata: {
          source: command.metadata?.source || "scheduler-service",
          correlationId: command.metadata?.correlationId,
          userId: command.metadata?.userId,
          sessionId: command.metadata?.sessionId,
          healthcareContext: command.metadata?.healthcareContext,
        },
      });

      await this.notificationRepository.save(notification);

      const deliveryResults = await this.deliveryService.deliver({
        notificationId: notification.id,
        recipient,
        content,
        channels,
        priority: notification.priority,
        metadata: notification.metadata,
      });

      const hasSuccess = deliveryResults.some(r => r.success);

      if (hasSuccess) {
        notification.markAsSent(deliveryResults);
        await this.notificationRepository.save(notification);
        return {
          notificationId: notification.id,
          status: "SENT",
          deliveryResults,
          sentAt: notification.sentAt,
          message: `Đã gửi thành công thông báo`,
        };
      } else {
        notification.markAsFailed(
          deliveryResults.map(r => ({
            channel: r.channel,
            reason: 'PROVIDER_ERROR',
            errorMessage: r.providerResponse?.error || 'Delivery failed',
            retryable: true,
          }))
        );
        await this.notificationRepository.save(notification);
        return {
          notificationId: notification.id,
          status: "FAILED",
          deliveryResults,
          message: `Gửi thông báo thất bại`,
        };
      }
    } catch (error) {
      throw new Error(`Lỗi khi gửi notification: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private async getRecipientInfo(recipientId: string, recipientType: string): Promise<RecipientInfo> {
    return RecipientInfo.create({
      recipientId,
      recipientType: recipientType as "PATIENT" | "DOCTOR" | "NURSE" | "ADMIN",
      fullName: `User ${recipientId}`,
      contactInfo: {
        email: `${recipientId}@example.com`,
        phoneNumber: "+84123456789"
      },
      preferences: {
        preferredChannels: ["EMAIL", "SMS"],
        timezone: "Asia/Ho_Chi_Minh",
        language: "vi",
        optOut: {
          marketing: false,
          reminders: false,
          emergency: false
        }
      }
    });
  }

  private determineChannels(requestedChannels: string[], recipient: RecipientInfo): NotificationChannel[] {
    const channels: NotificationChannel[] = [];
    for (const channelType of requestedChannels) {
      if (recipient.canReceiveOnChannel(channelType)) {
        channels.push(NotificationChannel.create(channelType));
      }
    }
    if (channels.length === 0) {
      throw new Error("Không có kênh nào khả dụng cho recipient");
    }
    return channels;
  }
}
