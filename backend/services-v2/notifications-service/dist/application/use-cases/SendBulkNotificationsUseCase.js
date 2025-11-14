"use strict";
/**
 * SendBulkNotificationsUseCase - Command Use Case
 * Send notifications to multiple recipients
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Bulk Operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendBulkNotificationsUseCase = void 0;
class SendBulkNotificationsUseCase {
    constructor(sendNotificationUseCase) {
        this.sendNotificationUseCase = sendNotificationUseCase;
    }
    async execute(command) {
        const results = [];
        let successful = 0;
        let failed = 0;
        for (const recipientId of command.recipientIds) {
            try {
                const result = await this.sendNotificationUseCase.execute({
                    recipientId,
                    recipientType: command.recipientType,
                    templateType: command.templateType,
                    templateData: command.templateData,
                    channels: command.channels,
                    priority: command.priority,
                    metadata: {
                        ...command.metadata,
                        bulkOperation: true
                    }
                });
                results.push({
                    recipientId,
                    notificationId: result.notificationId,
                    status: 'SUCCESS'
                });
                successful++;
            }
            catch (error) {
                results.push({
                    recipientId,
                    status: 'FAILED',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                failed++;
            }
        }
        return {
            totalRequested: command.recipientIds.length,
            successful,
            failed,
            results
        };
    }
}
exports.SendBulkNotificationsUseCase = SendBulkNotificationsUseCase;
//# sourceMappingURL=SendBulkNotificationsUseCase.js.map