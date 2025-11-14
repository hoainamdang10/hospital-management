"use strict";
/**
 * ProcessNotificationQueueUseCase - Command Use Case
 * Process pending notifications in queue
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Queue Processing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessNotificationQueueUseCase = void 0;
const NotificationId_1 = require("../../domain/value-objects/NotificationId");
class ProcessNotificationQueueUseCase {
    constructor(notificationRepository, deliveryService) {
        this.notificationRepository = notificationRepository;
        this.deliveryService = deliveryService;
    }
    async execute(command) {
        const startTime = Date.now();
        const batchSize = command.batchSize || 100;
        try {
            // Get scheduled notifications due for processing
            const notifications = await this.notificationRepository.findScheduledForProcessing(new Date(), batchSize);
            const details = [];
            let successful = 0;
            let failed = 0;
            let expired = 0;
            for (const notification of notifications) {
                try {
                    // Check if expired
                    const expiresAt = notification.metadata.expiresAt;
                    if (expiresAt && new Date(expiresAt) < new Date()) {
                        await this.notificationRepository.updateStatus(NotificationId_1.NotificationId.fromString(notification.id), 'EXPIRED');
                        expired++;
                        details.push({
                            notificationId: notification.id,
                            status: 'EXPIRED',
                            message: 'Notification expired'
                        });
                        continue;
                    }
                    // Deliver notification
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
                        successful++;
                        details.push({
                            notificationId: notification.id,
                            status: 'SENT',
                            message: 'Sent successfully'
                        });
                    }
                    else {
                        notification.markAsFailed(deliveryResults.map(r => ({
                            channel: r.channel,
                            reason: 'DELIVERY_FAILED',
                            errorMessage: r.failureReason || 'Unknown error',
                            retryable: r.retryable
                        })));
                        await this.notificationRepository.update(notification);
                        failed++;
                        details.push({
                            notificationId: notification.id,
                            status: 'FAILED',
                            message: 'Delivery failed'
                        });
                    }
                }
                catch (error) {
                    failed++;
                    details.push({
                        notificationId: notification.id,
                        status: 'FAILED',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            const processingTime = Date.now() - startTime;
            const remaining = await this.notificationRepository.getQueueSize();
            return {
                totalProcessed: notifications.length,
                successful,
                failed,
                expired,
                remaining,
                processingTime,
                statistics: {
                    byPriority: {},
                    byChannel: {}
                },
                details
            };
        }
        catch (error) {
            throw new Error(`Failed to process queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.ProcessNotificationQueueUseCase = ProcessNotificationQueueUseCase;
//# sourceMappingURL=ProcessNotificationQueueUseCase.js.map