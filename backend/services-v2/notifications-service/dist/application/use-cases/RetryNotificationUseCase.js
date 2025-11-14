"use strict";
/**
 * RetryNotificationUseCase - Command Use Case
 * Retry failed notification delivery
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryNotificationUseCase = void 0;
const NotificationId_1 = require("../../domain/value-objects/NotificationId");
class RetryNotificationUseCase {
    constructor(notificationRepository, deliveryService) {
        this.notificationRepository = notificationRepository;
        this.deliveryService = deliveryService;
    }
    async execute(command) {
        try {
            const notificationId = NotificationId_1.NotificationId.fromString(command.notificationId);
            const notification = await this.notificationRepository.findById(notificationId);
            if (!notification) {
                throw new Error('Notification not found');
            }
            if (notification.status !== 'FAILED') {
                throw new Error('Can only retry failed notifications');
            }
            // Retry delivery
            const deliveryResults = await this.deliveryService.deliver({
                notificationId: notification.id,
                recipient: notification.recipient,
                content: notification.content,
                channels: notification.channels,
                priority: notification.priority,
                metadata: notification.metadata
            });
            const hasSuccess = deliveryResults.some(r => r.success);
            if (hasSuccess) {
                notification.markAsSent(deliveryResults);
                await this.notificationRepository.update(notification);
                return {
                    notificationId: command.notificationId,
                    status: 'SENT',
                    retryAttempt: 1,
                    deliveryResults,
                    message: 'Notification retry successful'
                };
            }
            else {
                notification.markAsFailed(deliveryResults.map(r => ({
                    channel: r.channel,
                    reason: 'RETRY_FAILED',
                    errorMessage: r.providerResponse?.error || 'Retry failed',
                    retryable: true
                })));
                await this.notificationRepository.update(notification);
                return {
                    notificationId: command.notificationId,
                    status: 'FAILED',
                    retryAttempt: 1,
                    deliveryResults,
                    message: 'Notification retry failed'
                };
            }
        }
        catch (error) {
            throw new Error(`Failed to retry notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.RetryNotificationUseCase = RetryNotificationUseCase;
//# sourceMappingURL=RetryNotificationUseCase.js.map