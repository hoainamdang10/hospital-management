"use strict";
/**
 * SendNotificationUseCase - Simplified for Event Consumer Integration
 * Nhận command từ Event Consumers và gửi notification ngay lập tức
 *
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, DDD, Event Consumer Integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendNotificationUseCase = void 0;
const Notification_1 = require("../../domain/aggregates/Notification");
const RecipientInfo_1 = require("../../domain/value-objects/RecipientInfo");
const NotificationChannel_1 = require("../../domain/value-objects/NotificationChannel");
const NotificationContent_1 = require("../../domain/value-objects/NotificationContent");
class SendNotificationUseCase {
    constructor(notificationRepository, templateService, deliveryService) {
        this.notificationRepository = notificationRepository;
        this.templateService = templateService;
        this.deliveryService = deliveryService;
    }
    async execute(command) {
        // Validate command
        if (!command.recipientId ||
            !command.recipientType ||
            !command.channels.length) {
            throw new Error("Invalid notification command: missing required fields");
        }
        const candidateName = (command.recipientName ||
            command.metadata?.recipientName ||
            "").trim();
        const normalizedName = candidateName.length >= 2 ? candidateName.replace(/\s+/g, " ") : "";
        const fallbackName = `Người nhận ${command.recipientType}`.trim();
        const contactEmail = command.recipientEmail || command.metadata?.email;
        const contactPhone = command.recipientPhone || command.metadata?.phoneNumber;
        const contactPushToken = command.metadata?.pushToken;
        const recipient = RecipientInfo_1.RecipientInfo.create({
            recipientId: command.recipientId,
            recipientType: command.recipientType,
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
                content = await this.templateService.applyTemplateByType(command.templateType, templateData, recipient.getPreferredLanguage());
            }
            catch (error) {
                // Demo fallback: nếu thiếu template thì dựng content text đơn giản để tránh fail consumer
                content = NotificationContent_1.NotificationContent.create({
                    subject: command.templateType,
                    body: typeof templateData === "string"
                        ? templateData
                        : JSON.stringify(templateData ?? {}),
                    contentType: "TEXT",
                    language: "vi",
                });
            }
        }
        else if (command.title && command.content) {
            content = NotificationContent_1.NotificationContent.create({
                subject: command.title,
                body: command.content,
                contentType: "TEXT",
                language: "vi",
            });
        }
        else {
            // Last-resort fallback to avoid dropping events
            content = NotificationContent_1.NotificationContent.create({
                subject: "Thông báo",
                body: JSON.stringify(templateData ?? {}),
                contentType: "TEXT",
                language: "vi",
            });
        }
        const channels = this.determineChannels(command.channels, recipient);
        const notification = Notification_1.Notification.create({
            recipient,
            templateType: command.templateType || "NOTIFICATION",
            content,
            channels,
            priority: command.priority || "NORMAL",
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
        }
        else {
            notification.markAsFailed(deliveryResults.map((r) => ({
                channel: r.channel,
                reason: "PROVIDER_ERROR",
                errorMessage: r.providerResponse?.error || "Delivery failed",
                retryable: true,
            })));
            await this.notificationRepository.save(notification);
            return deliveryResults;
        }
    }
    catch(error) {
        throw new Error(`Lỗi khi gửi notification: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    determineChannels(requestedChannels, recipient) {
        const channels = [];
        for (const channelType of requestedChannels) {
            if (recipient.canReceiveOnChannel(channelType)) {
                channels.push(NotificationChannel_1.NotificationChannel.create(channelType));
            }
        }
        if (channels.length === 0) {
            throw new Error("Không có kênh nào khả dụng cho recipient");
        }
        return channels;
    }
}
exports.SendNotificationUseCase = SendNotificationUseCase;
//# sourceMappingURL=SendNotificationUseCase.js.map