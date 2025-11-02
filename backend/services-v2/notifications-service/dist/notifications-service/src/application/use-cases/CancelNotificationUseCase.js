"use strict";
/**
 * CancelNotificationUseCase - Command Use Case
 * Cancel scheduled or pending notification
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelNotificationUseCase = void 0;
const NotificationId_1 = require("../../domain/value-objects/NotificationId");
class CancelNotificationUseCase {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute(command) {
        try {
            const notificationId = NotificationId_1.NotificationId.fromString(command.notificationId);
            const notification = await this.notificationRepository.findById(notificationId);
            if (!notification) {
                throw new Error('Notification not found');
            }
            // Update status to CANCELLED
            await this.notificationRepository.updateStatus(notificationId, 'CANCELLED');
            return {
                notificationId: command.notificationId,
                status: 'CANCELLED',
                message: 'Notification cancelled successfully'
            };
        }
        catch (error) {
            throw new Error(`Failed to cancel notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.CancelNotificationUseCase = CancelNotificationUseCase;
//# sourceMappingURL=CancelNotificationUseCase.js.map