"use strict";
/**
 * GetNotificationsByRecipientUseCase - Query Use Case
 * Get notifications for a specific recipient with pagination
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNotificationsByRecipientUseCase = void 0;
class GetNotificationsByRecipientUseCase {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute(query) {
        try {
            const limit = query.limit || 20;
            const offset = query.offset || 0;
            // Build search criteria
            const criteria = {
                recipientId: query.recipientId,
                limit: limit + 1, // Fetch one extra to check hasMore
                offset
            };
            if (query.status)
                criteria.status = query.status;
            if (query.priority)
                criteria.priority = query.priority;
            if (query.dateRange) {
                criteria.createdAfter = query.dateRange.start;
                criteria.createdBefore = query.dateRange.end;
            }
            const notifications = await this.notificationRepository.findByCriteria(criteria);
            const hasMore = notifications.length > limit;
            const results = notifications.slice(0, limit);
            // Get total count
            const total = await this.notificationRepository.countByCriteria({
                recipientId: query.recipientId,
                status: query.status,
                priority: query.priority
            });
            return {
                notifications: results.map(n => this.mapNotification(n)),
                total,
                hasMore,
                pagination: { limit, offset }
            };
        }
        catch (error) {
            throw new Error(`Failed to get notifications by recipient: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    mapNotification(notification) {
        return {
            notificationId: notification.id,
            recipientId: notification.recipient.getRecipientId(),
            templateType: notification.templateType,
            subject: notification.content.getSubject(),
            body: notification.content.getBody(),
            channels: notification.channels.map((c) => c.getType()),
            status: notification.status,
            priority: notification.priority,
            sentAt: notification.sentAt,
            createdAt: notification.createdAt,
            metadata: notification.metadata
        };
    }
}
exports.GetNotificationsByRecipientUseCase = GetNotificationsByRecipientUseCase;
//# sourceMappingURL=GetNotificationsByRecipientUseCase.js.map