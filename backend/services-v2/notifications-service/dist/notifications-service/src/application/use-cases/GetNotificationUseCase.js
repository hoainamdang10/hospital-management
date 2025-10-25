"use strict";
/**
 * GetNotificationUseCase - Query Use Case
 * Get single notification by ID
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNotificationUseCase = void 0;
const NotificationId_1 = require("../../domain/value-objects/NotificationId");
class GetNotificationUseCase {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute(query) {
        try {
            const notificationId = new NotificationId_1.NotificationId(query.notificationId);
            const notification = await this.notificationRepository.findById(notificationId);
            if (!notification) {
                return { notification: null };
            }
            return {
                notification: this.mapToResult(notification)
            };
        }
        catch (error) {
            throw new Error(`Failed to get notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    mapToResult(notification) {
        const contactInfo = notification.recipient.getContactInfo();
        return {
            notificationId: notification.id,
            recipientId: notification.recipient.getRecipientId(),
            recipientType: notification.recipient.getRecipientType(),
            recipientName: notification.recipient.getFullName(),
            templateType: notification.templateType,
            subject: notification.content.getSubject() || '',
            body: notification.content.getBody(),
            channels: notification.channels.map(c => c.getType()),
            status: notification.status,
            priority: notification.priority,
            sentAt: notification.sentAt,
            deliveryResults: notification.deliveryResults,
            successfulChannels: notification.deliveryResults?.filter((r) => r.success).map((r) => r.channel) || [],
            failedChannels: notification.deliveryResults?.filter((r) => !r.success).map((r) => r.channel) || [],
            retryCount: 0,
            healthcareContext: notification.metadata.healthcareContext,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt
        };
    }
}
exports.GetNotificationUseCase = GetNotificationUseCase;
//# sourceMappingURL=GetNotificationUseCase.js.map