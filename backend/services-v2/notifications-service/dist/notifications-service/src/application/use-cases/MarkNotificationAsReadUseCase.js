"use strict";
/**
 * MarkNotificationAsReadUseCase - Command Use Case
 * Mark notification as read/unread
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkNotificationAsReadUseCase = void 0;
const NotificationId_1 = require("../../domain/value-objects/NotificationId");
class MarkNotificationAsReadUseCase {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute(command) {
        try {
            const notificationId = NotificationId_1.NotificationId.fromString(command.notificationId);
            // Find notification
            const notification = await this.notificationRepository.findById(notificationId);
            if (!notification) {
                throw new Error('Notification not found');
            }
            // Authorization check - user can only mark their own notifications
            if (notification.getRecipient().getRecipientId() !== command.userId) {
                throw new Error('Unauthorized: You can only mark your own notifications');
            }
            // Update read_at timestamp
            const readAt = command.isRead ? new Date() : null;
            await this.notificationRepository.markAsRead(notificationId, readAt);
            return {
                success: true,
                notificationId: command.notificationId,
                readAt,
                message: command.isRead
                    ? 'Notification marked as read'
                    : 'Notification marked as unread'
            };
        }
        catch (error) {
            throw new Error(`Failed to mark notification as ${command.isRead ? 'read' : 'unread'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.MarkNotificationAsReadUseCase = MarkNotificationAsReadUseCase;
//# sourceMappingURL=MarkNotificationAsReadUseCase.js.map