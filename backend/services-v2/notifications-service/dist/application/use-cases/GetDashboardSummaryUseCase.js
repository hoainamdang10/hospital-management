"use strict";
/**
 * GetDashboardSummaryUseCase - Query Use Case
 * Get dashboard summary with key metrics
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dashboard
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDashboardSummaryUseCase = void 0;
class GetDashboardSummaryUseCase {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async execute() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const todayStats = await this.notificationRepository.getStatistics({
                start: today,
                end: tomorrow
            });
            const failureRates = await this.notificationRepository.getFailureRateByChannel();
            const queuePending = await this.notificationRepository.getQueueSize();
            const queueUrgent = await this.notificationRepository.getQueueSize('URGENT');
            // Generate alerts
            const alerts = [];
            if (todayStats.byStatus['FAILED'] > 100) {
                alerts.push({ severity: 'HIGH', message: `${todayStats.byStatus['FAILED']} failed notifications today` });
            }
            Object.entries(failureRates).forEach(([channel, rate]) => {
                if (rate > 10) {
                    alerts.push({ severity: 'MEDIUM', message: `${channel} has ${rate.toFixed(1)}% failure rate` });
                }
            });
            return {
                overview: {
                    totalToday: todayStats.totalNotifications,
                    sentToday: (todayStats.byStatus['SENT'] || 0),
                    failedToday: todayStats.byStatus['FAILED'] || 0,
                    deliveryRateToday: todayStats.successRate
                },
                queue: {
                    pending: queuePending,
                    scheduled: todayStats.byStatus['SCHEDULED'] || 0,
                    processing: todayStats.byStatus['PROCESSING'] || 0,
                    urgent: queueUrgent
                },
                recentActivity: todayStats.recentActivity,
                topTemplates: Object.entries(todayStats.byTemplateType).map(([templateType, count]) => ({
                    templateType,
                    count: count,
                    successRate: 95.5
                })).slice(0, 5),
                channelPerformance: Object.entries(failureRates).reduce((acc, [channel, rate]) => {
                    acc[channel] = {
                        sent: todayStats.byChannel[channel] || 0,
                        failureRate: rate
                    };
                    return acc;
                }, {}),
                alerts
            };
        }
        catch (error) {
            throw new Error(`Failed to get dashboard summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.GetDashboardSummaryUseCase = GetDashboardSummaryUseCase;
//# sourceMappingURL=GetDashboardSummaryUseCase.js.map