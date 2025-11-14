"use strict";
/**
 * NotificationApplicationService - Complete Application Service
 * Orchestrates all notification operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Full Implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationApplicationService = void 0;
class NotificationApplicationService {
    constructor(sendNotificationUseCase, getNotificationUseCase, getNotificationsByRecipientUseCase, searchNotificationsUseCase, cancelNotificationUseCase, retryNotificationUseCase, sendBulkNotificationsUseCase, processNotificationQueueUseCase, getNotificationAnalyticsUseCase, getDashboardSummaryUseCase, getHealthStatusUseCase, updateNotificationPreferencesUseCase, getNotificationPreferencesUseCase) {
        this.sendNotificationUseCase = sendNotificationUseCase;
        this.getNotificationUseCase = getNotificationUseCase;
        this.getNotificationsByRecipientUseCase = getNotificationsByRecipientUseCase;
        this.searchNotificationsUseCase = searchNotificationsUseCase;
        this.cancelNotificationUseCase = cancelNotificationUseCase;
        this.retryNotificationUseCase = retryNotificationUseCase;
        this.sendBulkNotificationsUseCase = sendBulkNotificationsUseCase;
        this.processNotificationQueueUseCase = processNotificationQueueUseCase;
        this.getNotificationAnalyticsUseCase = getNotificationAnalyticsUseCase;
        this.getDashboardSummaryUseCase = getDashboardSummaryUseCase;
        this.getHealthStatusUseCase = getHealthStatusUseCase;
        this.updateNotificationPreferencesUseCase = updateNotificationPreferencesUseCase;
        this.getNotificationPreferencesUseCase = getNotificationPreferencesUseCase;
    }
    // ==================== Notification Operations ====================
    /**
     * Send notification immediately
     */
    async sendNotification(command) {
        return await this.sendNotificationUseCase.execute(command);
    }
    /**
     * Schedule notification for future delivery
     * Note: Actual scheduling is handled by Scheduler Service
     * This creates a SCHEDULED notification that will be picked up
     */
    async scheduleNotification(command) {
        // For now, use send notification with scheduledAt
        return await this.sendNotificationUseCase.execute({
            ...command,
            metadata: {
                ...command.metadata,
                scheduledAt: command.scheduledAt
            }
        });
    }
    /**
     * Get notification by ID
     */
    async getNotification(notificationId) {
        const result = await this.getNotificationUseCase.execute({ notificationId });
        return result.notification;
    }
    /**
     * Get notifications by recipient
     */
    async getNotificationsByRecipient(recipientId, options = {}) {
        return await this.getNotificationsByRecipientUseCase.execute({
            recipientId,
            ...options
        });
    }
    /**
     * Search notifications
     */
    async searchNotifications(criteria) {
        return await this.searchNotificationsUseCase.execute(criteria);
    }
    /**
     * Cancel notification
     */
    async cancelNotification(notificationId, reason, userId) {
        return await this.cancelNotificationUseCase.execute({
            notificationId,
            reason,
            userId
        });
    }
    /**
     * Retry failed notification
     */
    async retryNotification(notificationId, channels, userId) {
        return await this.retryNotificationUseCase.execute({
            notificationId,
            channels,
            userId
        });
    }
    /**
     * Send bulk notifications
     */
    async sendBulkNotifications(command) {
        return await this.sendBulkNotificationsUseCase.execute(command);
    }
    /**
     * Process notification queue
     */
    async processQueue(command) {
        return await this.processNotificationQueueUseCase.execute(command);
    }
    // ==================== Analytics & Reporting ====================
    /**
     * Get notification analytics
     */
    async getNotificationAnalytics(dateRange, options = {}) {
        return await this.getNotificationAnalyticsUseCase.execute({
            dateRange,
            ...options
        });
    }
    /**
     * Get dashboard summary
     */
    async getDashboardSummary() {
        return await this.getDashboardSummaryUseCase.execute();
    }
    /**
     * Get service health status
     */
    async getHealthStatus() {
        return await this.getHealthStatusUseCase.execute();
    }
    // ==================== Preferences Management ====================
    /**
     * Get user preferences
     */
    async getPreferences(userId) {
        return await this.getNotificationPreferencesUseCase.execute({ userId });
    }
    /**
     * Update user preferences
     */
    async updatePreferences(command) {
        return await this.updateNotificationPreferencesUseCase.execute(command);
    }
}
exports.NotificationApplicationService = NotificationApplicationService;
//# sourceMappingURL=NotificationApplicationService.js.map