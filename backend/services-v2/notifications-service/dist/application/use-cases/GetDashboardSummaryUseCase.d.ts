/**
 * GetDashboardSummaryUseCase - Query Use Case
 * Get dashboard summary with key metrics
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dashboard
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
export interface GetDashboardSummaryResult {
    overview: {
        totalToday: number;
        sentToday: number;
        failedToday: number;
        deliveryRateToday: number;
    };
    queue: {
        pending: number;
        scheduled: number;
        processing: number;
        urgent: number;
    };
    recentActivity: {
        last24Hours: number;
        lastWeek: number;
        lastMonth: number;
    };
    topTemplates: Array<{
        templateType: string;
        count: number;
        successRate: number;
    }>;
    channelPerformance: Record<string, {
        sent: number;
        failureRate: number;
    }>;
    alerts: Array<{
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
    }>;
}
export declare class GetDashboardSummaryUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(): Promise<GetDashboardSummaryResult>;
}
//# sourceMappingURL=GetDashboardSummaryUseCase.d.ts.map