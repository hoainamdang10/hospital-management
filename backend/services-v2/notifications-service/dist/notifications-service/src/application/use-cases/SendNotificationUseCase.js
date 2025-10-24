"use strict";
/**
 * SendNotificationUseCase - Simplified for Scheduler Integration
 * Nhận command từ Scheduler Service và gửi notification ngay lập tức
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Scheduler Integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendNotificationUseCase = void 0;
const Notification_1 = require("../../domain/aggregates/Notification");
const RecipientInfo_1 = require("../../domain/value-objects/RecipientInfo");
const NotificationChannel_1 = require("../../domain/value-objects/NotificationChannel");
class SendNotificationUseCase {
    constructor(notificationRepository, templateService, deliveryService) {
        this.notificationRepository = notificationRepository;
        this.templateService = templateService;
        this.deliveryService = deliveryService;
    }
    async execute(command) {
        try {
            const recipient = await this.getRecipientInfo(command.recipientId, command.recipientType);
            const content = await this.templateService.applyTemplateByType(command.templateType, command.templateData, recipient.getPreferredLanguage());
            const channels = this.determineChannels(command.channels, recipient);
            const notification = Notification_1.Notification.create({
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
            }
            else {
                notification.markAsFailed(deliveryResults.map(r => ({
                    channel: r.channel,
                    reason: 'PROVIDER_ERROR',
                    errorMessage: r.providerResponse?.error || 'Delivery failed',
                    retryable: true,
                })));
                await this.notificationRepository.save(notification);
                return {
                    notificationId: notification.id,
                    status: "FAILED",
                    deliveryResults,
                    message: `Gửi thông báo thất bại`,
                };
            }
        }
        catch (error) {
            throw new Error(`Lỗi khi gửi notification: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async getRecipientInfo(recipientId, recipientType) {
        return RecipientInfo_1.RecipientInfo.create({
            recipientId,
            recipientType: recipientType,
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