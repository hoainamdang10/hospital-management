"use strict";
/**
 * GetUserNotificationsUseCase - Query Use Case
 * Lấy danh sách thông báo cho người dùng với phân trang và filter cơ bản
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserNotificationsUseCase = void 0;
class GetUserNotificationsUseCase {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute(query) {
        const limit = query.limit && query.limit > 0 ? query.limit : 20;
        const offset = query.offset && query.offset >= 0 ? query.offset : 0;
        const singleNotificationMode = Boolean(query.notificationId);
        if (!query.userId) {
            throw new Error("userId is required");
        }
        try {
            const criteria = {
                recipientId: query.userId,
                limit: singleNotificationMode ? 1 : limit + 1,
                offset: singleNotificationMode ? 0 : offset,
            };
            if (query.notificationId) {
                criteria.notificationId = query.notificationId;
            }
            if (query.status === "read") {
                criteria.isRead = true;
            }
            else if (query.status === "unread") {
                criteria.isRead = false;
            }
            if (query.priority) {
                criteria.priority = query.priority;
            }
            if (query.startDate) {
                criteria.createdAfter = query.startDate;
            }
            if (query.endDate) {
                criteria.createdBefore = query.endDate;
            }
            const notifications = await this.notificationRepository.findByCriteria(criteria);
            const hasMore = singleNotificationMode
                ? false
                : notifications.length > limit;
            const results = singleNotificationMode
                ? notifications
                : notifications.slice(0, limit);
            const total = await this.notificationRepository.countByCriteria({
                recipientId: query.userId,
                isRead: query.status === "read"
                    ? true
                    : query.status === "unread"
                        ? false
                        : undefined,
                priority: query.priority,
            });
            const unreadCount = await this.notificationRepository.countByCriteria({
                recipientId: query.userId,
                isRead: false,
            });
            return {
                notifications: results.map((notification) => this.mapNotification(notification)),
                total,
                unreadCount,
                hasMore,
                pagination: { limit, offset },
            };
        }
        catch (error) {
            throw new Error(`Failed to get user notifications: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    mapNotification(notification) {
        return {
            notificationId: notification.getId().value,
            recipientId: notification.getRecipient().getRecipientId(),
            templateType: notification.templateType,
            subject: notification.getContent().getSubject() ?? "",
            body: notification.getContent().getBody(),
            priority: notification.getPriority(),
            status: notification.getStatus(),
            channels: notification.getChannels().map((channel) => channel.getType()),
            readAt: notification.getReadAt() ?? null,
            createdAt: notification.getCreatedAt(),
            sentAt: notification.getSentAt() ?? null,
            deliveredAt: notification.getDeliveredAt() ?? null,
            healthcareContext: notification.getHealthcareContext(),
        };
    }
}
exports.GetUserNotificationsUseCase = GetUserNotificationsUseCase;
//# sourceMappingURL=GetUserNotificationsUseCase.js.map