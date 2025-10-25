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
  dateRange: { start: Date; end: Date };
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

export class GetNotificationAnalyticsUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(query: GetAnalyticsQuery): Promise<GetAnalyticsResult> {
    try {
      const statistics = await this.notificationRepository.getStatistics(query.dateRange);
      const trends = await this.notificationRepository.getNotificationTrends(
        Math.floor((query.dateRange.end.getTime() - query.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        summary: {
          totalNotifications: statistics.totalNotifications,
          sentNotifications: (statistics.byStatus['SENT'] || 0) + (statistics.byStatus['DELIVERED'] || 0),
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
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

