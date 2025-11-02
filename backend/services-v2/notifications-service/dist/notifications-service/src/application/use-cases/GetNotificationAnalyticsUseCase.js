"use strict";
/**
 * GetNotificationAnalyticsUseCase - Query Use Case
 * Get notification analytics and metrics
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Analytics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNotificationAnalyticsUseCase = void 0;
class GetNotificationAnalyticsUseCase {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute(query) {
        try {
            const statistics = await this.notificationRepository.getStatistics(query.dateRange);
            const trends = await this.notificationRepository.getNotificationTrends(Math.floor((query.dateRange.end.getTime() - query.dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));
            return {
                summary: {
                    totalNotifications: statistics.totalNotifications,
                    sentNotifications: (statistics.byStatus['SENT'] || 0),
                    failedNotifications: statistics.byStatus['FAILED'] || 0,
                    deliveryRate: statistics.successRate,
                    averageDeliveryTime: statistics.averageDeliveryTime
                },
                byStatus: statistics.byStatus,
                byPriority: statistics.byPriority,
                byChannel: statistics.byChannel,
                byTemplateType: statistics.byTemplateType,
                trends,
                failureReasons: statistics.failureReasons
            };
        }
        catch (error) {
            throw new Error(`Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.GetNotificationAnalyticsUseCase = GetNotificationAnalyticsUseCase;
//# sourceMappingURL=GetNotificationAnalyticsUseCase.js.map