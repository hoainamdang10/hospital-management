/**
 * SendNotificationUseCase - Simplified for Event Consumer Integration
 * Nhận command từ Event Consumers và gửi notification ngay lập tức
 *
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, DDD, Event Consumer Integration
 */

import { Notification } from "../../domain/aggregates/Notification";
import { RecipientInfo } from "../../domain/value-objects/RecipientInfo";
import { NotificationChannel } from "../../domain/value-objects/NotificationChannel";
import { NotificationContent } from "../../domain/value-objects/NotificationContent";
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import {
  ITemplateService,
  TemplateType,
} from "../../domain/services/ITemplateService";
import {
  IDeliveryService,
  DeliveryResult,
} from "../../domain/services/IDeliveryService";

export interface SendNotificationCommand {
  recipientId: string;
  recipientType: "PATIENT" | "DOCTOR" | "NURSE" | "ADMIN" | string;
  recipientName?: string; // ✅ ADDED for personalization
  recipientEmail?: string; // ✅ ADDED for delivery
  recipientPhone?: string; // ✅ ADDED for SMS delivery
  type?: string;
  title?: string;
  content?: string;
  templateType?: string;
  templateData?: Record<string, any>;
  data?: Record<string, any>; // ✅ ADDED - alias for templateData
  channels: string[];
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | string;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
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
    private readonly deliveryService: IDeliveryService,
  ) {}

  async execute(command: SendNotificationCommand): Promise<DeliveryResult[]> {
    // Validate command
    if (
      !command.recipientId ||
      !command.recipientType ||
      !command.channels.length
    ) {
      throw new Error("Invalid notification command: missing required fields");
    }

    const candidateName = (
      command.recipientName ||
      command.metadata?.recipientName ||
      ""
    ).trim();
    const normalizedName =
      candidateName.length >= 2 ? candidateName.replace(/\s+/g, " ") : "";
    const fallbackName = `Người nhận ${command.recipientType}`.trim();

    const contactEmail = command.recipientEmail || command.metadata?.email;
    const contactPhone =
      command.recipientPhone || command.metadata?.phoneNumber;
    const contactPushToken = command.metadata?.pushToken;

    const recipient = RecipientInfo.create({
      recipientId: command.recipientId,
      recipientType: command.recipientType as
        | "PATIENT"
        | "DOCTOR"
        | "NURSE"
        | "ADMIN",
      fullName: normalizedName || fallbackName,
      contactInfo: {
        email: contactEmail || `${command.recipientId}@example.com`,
        phoneNumber: contactPhone,
        pushToken: contactPushToken,
      },
      preferences: {
        preferredChannels: ["EMAIL", "SMS"],
        timezone: "Asia/Ho_Chi_Minh",
        language: "vi",
        optOut: {
          marketing: false,
          reminders: false,
          emergency: false,
        },
      },
    });

    // Determine content - either from template or direct content
    const templateData = command.templateData || command.data;

    let content;
    if (command.templateType && templateData) {
      try {
        content = await this.templateService.applyTemplateByType(
          command.templateType as TemplateType,
          templateData,
          recipient.getPreferredLanguage(),
        );
      } catch (error) {
        // Demo fallback: nếu thiếu template thì dựng content text đơn giản để tránh fail consumer
        content = NotificationContent.create({
          subject: command.templateType,
          body:
            typeof templateData === "string"
              ? templateData
              : JSON.stringify(templateData ?? {}),
          contentType: "TEXT",
          language: "vi",
        });
      }
    } else if (command.title && command.content) {
      content = NotificationContent.create({
        subject: command.title,
        body: command.content,
        contentType: "TEXT",
        language: "vi",
      });
    } else {
      // Last-resort fallback to avoid dropping events
      content = NotificationContent.create({
        subject: "Thông báo",
        body: JSON.stringify(templateData ?? {}),
        contentType: "TEXT",
        language: "vi",
      });
    }

    const channels = this.determineChannels(command.channels, recipient);

    const notification = Notification.create({
      recipient,
      templateType: command.templateType || "NOTIFICATION",
      content,
      channels,
      priority:
        (command.priority as "LOW" | "NORMAL" | "HIGH" | "URGENT") || "NORMAL",
      metadata: command.metadata || {
        source: "event-consumer",
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

    const hasSuccess = deliveryResults.some((r) => r.success);

    if (hasSuccess) {
      notification.markAsSent(deliveryResults);
      await this.notificationRepository.save(notification);
      return deliveryResults;
    } else {
      notification.markAsFailed(
        deliveryResults.map((r) => ({
          channel: r.channel,
          reason: "PROVIDER_ERROR",
          errorMessage: r.providerResponse?.error || "Delivery failed",
          retryable: true,
        })),
      );
      await this.notificationRepository.save(notification);
      return deliveryResults;
    }
  }
  catch(error: any) {
    throw new Error(
      `Lỗi khi gửi notification: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  private determineChannels(
    requestedChannels: string[],
    recipient: RecipientInfo,
  ): NotificationChannel[] {
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
