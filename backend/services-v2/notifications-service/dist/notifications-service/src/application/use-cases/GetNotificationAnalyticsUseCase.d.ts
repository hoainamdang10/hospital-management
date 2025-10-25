/**
 * GetNotificationAnalyticsUseCase - Query Use Case
 * Get notification analytics and metrics
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Analytics
 */
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
export interface GetAnalyticsQuery {
    dateRange: {
        start: Date;
        end: Date;
    };
    groupBy?: 'day' | 'week' | 'month';
    filters?: {
        recipientType?: string;
        templateType?: string;
        channel?: string;
        priority?: string;
        status?: string;
    };
}
export interface GetAnalyticsResult {
    summary: {
        totalNotifications: number;
        sentNotifications: number;
        failedNotifications: number;
        deliveryRate: number;
        averageDeliveryTime: number;
    };
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byChannel: Record<string, number>;
    byTemplateType: Record<string, number>;
    trends: Array<{
        date: Date;
        total: number;
        successful: number;
        failed: number;
    }>;
    failureReasons: Record<string, number>;
}
export declare class GetNotificationAnalyticsUseCase {
    private readonly notificationRepository;
    constructor(notificationRepository: INotificationRepository);
    execute(query: GetAnalyticsQuery): Promise<GetAnalyticsResult>;
}
//# sourceMappingURL=GetNotificationAnalyticsUseCase.d.ts.map