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
exports.MarkNotificationAsReadUseCase = exports.NotificationAccessDeniedError = exports.NotificationNotFoundError = void 0;
const NotificationId_1 = require("../../domain/value-objects/NotificationId");
class NotificationNotFoundError extends Error {
    constructor() {
        super("NOTIFICATION_NOT_FOUND");
        this.name = "NotificationNotFoundError";
    }
}
exports.NotificationNotFoundError = NotificationNotFoundError;
class NotificationAccessDeniedError extends Error {
    constructor() {
        super("NOTIFICATION_ACCESS_DENIED");
        this.name = "NotificationAccessDeniedError";
    }
}
exports.NotificationAccessDeniedError = NotificationAccessDeniedError;
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
                throw new NotificationNotFoundError();
            }
            // Authorization check - user can only mark their own notifications
            const normalizedRequestedUserId = command.userId.trim();
            const context = notification.getHealthcareContext?.();
            const allowedRecipientIds = new Set([
                notification.getRecipient().getRecipientId(),
                notification.metadata?.userId,
                context?.patientId,
                context?.doctorId,
            ]
                .filter((value) => Boolean(value))
                .map((value) => value.trim()));
            if (!allowedRecipientIds.has(normalizedRequestedUserId)) {
                throw new NotificationAccessDeniedError();
            }
            // Update read_at timestamp
            const readAt = command.isRead ? new Date() : null;
            await this.notificationRepository.markAsRead(notificationId, readAt);
            return {
                success: true,
                notificationId: command.notificationId,
                readAt,
                message: command.isRead
                    ? "Notification marked as read"
                    : "Notification marked as unread",
            };
        }
        catch (error) {
            if (error instanceof NotificationNotFoundError ||
                error instanceof NotificationAccessDeniedError) {
                throw error;
            }
            throw new Error(`Failed to mark notification as ${command.isRead ? "read" : "unread"}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}
exports.MarkNotificationAsReadUseCase = MarkNotificationAsReadUseCase;
//# sourceMappingURL=MarkNotificationAsReadUseCase.js.map