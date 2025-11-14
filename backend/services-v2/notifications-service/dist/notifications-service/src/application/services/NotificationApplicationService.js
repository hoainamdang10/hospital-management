"use strict";
/**
 * NotificationApplicationService - Simplified for Demo
 * Orchestrates core notification operations
 *
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, Demo Implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationApplicationService = void 0;
class NotificationApplicationService {
    constructor(sendNotificationUseCase, getNotificationUseCase, getNotificationPreferencesUseCase) {
        this.sendNotificationUseCase = sendNotificationUseCase;
        this.getNotificationUseCase = getNotificationUseCase;
        this.getNotificationPreferencesUseCase = getNotificationPreferencesUseCase;
    }
    // ==================== Notification Operations ====================
    /**
     * Send notification immediately
     */
    async sendNotification(command) {
        const deliveryResults = await this.sendNotificationUseCase.execute(command);
        return {
            notificationId: 'temp-id', // Will be updated when we have proper notification ID
            status: deliveryResults.some(r => r.success) ? "SENT" : "FAILED",
            deliveryResults,
            sentAt: new Date(),
            message: deliveryResults.some(r => r.success) ? 'Đã gửi thông báo thành công' : 'Gửi thông báo thất bại'
        };
    }
    /**
     * Get notification by ID
     */
    async getNotification(notificationId) {
        return await this.getNotificationUseCase.execute({ notificationId });
    }
    /**
     * Get user notification preferences
     */
    async getNotificationPreferences(userId, userType) {
        return await this.getNotificationPreferencesUseCase.execute({
            userId,
            userType
        });
    }
}
exports.NotificationApplicationService = NotificationApplicationService;
//# sourceMappingURL=NotificationApplicationService.js.map