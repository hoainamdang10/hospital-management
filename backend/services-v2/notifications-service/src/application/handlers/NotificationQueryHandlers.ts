/**
 * NotificationQueryHandlers - Application Query Handlers
 * CQRS query handlers for notification read operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Vietnamese Healthcare Standards
 */

import { INotificationRepository, NotificationSearchCriteria } from '../../domain/repositories/INotificationRepository';
import { ITemplateService } from '../../domain/services/ITemplateService';
import { IDeliveryService } from '../../domain/services/IDeliveryService';
import { NotificationId } from '../../domain/value-objects/NotificationId';
import { NotificationAggregate } from '../../domain/aggregates/NotificationAggregate';

export interface GetNotificationQuery {
  notificationId: string;
}

export interface GetNotificationsByRecipientQuery {
  recipientId: string;
  limit?: number;
  offset?: number;
  status?: string;
  priority?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SearchNotificationsQuery {
  criteria: NotificationSearchCriteria;
}

export interface GetNotificationHistoryQuery {
  recipientId: string;
  limit?: number;
  offset?: number;
  includeContent?: boolean;
}

export interface GetNotificationAnalyticsQuery {
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

export interface NotificationDTO {
  notificationId: string;
  recipientId: string;
  recipientType: string;
  recipientName: string;
  templateType: string;
  templateName: string;
  status: string;
  priority: string;
  channels: string[];
  scheduledAt: Date;
  sentAt?: Date;
  expiresAt?: Date;
  deliveryAttempts: number;
  retryCount: number;
  nextRetryAt?: Date;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
  content?: {
    subject?: string;
    preview: string;
    hasAttachments: boolean;
  };
  metadata: {
    correlationId?: string;
    source: string;
    tags: string[];
    healthcareContext?: any;
  };
}

export interface NotificationAnalyticsDTO {
  summary: {
    totalNotifications: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
    averageDeliveryTime: number;
  };
  trends: Array<{
    date: Date;
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }>;
  breakdowns: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byChannel: Record<string, number>;
    byTemplateType: Record<string, number>;
    byRecipientType: Record<string, number>;
  };
  performance: {
    averageDeliveryTimeByChannel: Record<string, number>;
    successRateByChannel: Record<string, number>;
    peakHours: Record<number, number>;
  };
  failures: {
    topFailureReasons: Record<string, number>;
    failuresByChannel: Record<string, number>;
    retryStatistics: {
      totalRetries: number;
      averageRetries: number;
      maxRetries: number;
    };
  };
}

export class NotificationQueryHandlers {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateService: ITemplateService,
    private readonly deliveryService: IDeliveryService
  ) {}

  /**
   * Handle get notification query
   */
  public async handleGetNotification(query: GetNotificationQuery): Promise<NotificationDTO | null> {
    try {
      if (!query.notificationId?.trim()) {
        throw new Error('Mã thông báo không được để trống');
      }

      const notificationId = NotificationId.fromString(query.notificationId);
      const notification = await this.notificationRepository.findById(notificationId);

      if (!notification) {
        return null;
      }

      return this.mapToDTO(notification);

    } catch (error) {
      throw new Error(`Lỗi khi lấy thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle get notifications by recipient query
   */
  public async handleGetNotificationsByRecipient(query: GetNotificationsByRecipientQuery): Promise<{
    notifications: NotificationDTO[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      if (!query.recipientId?.trim()) {
        throw new Error('Mã người nhận không được để trống');
      }

      // Build search criteria
      const criteria: NotificationSearchCriteria = {
        recipientId: query.recipientId,
        limit: query.limit || 20,
        offset: query.offset || 0,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };

      if (query.status) {
        criteria.status = query.status as any;
      }

      if (query.priority) {
        criteria.priority = query.priority as any;
      }

      if (query.dateRange) {
        criteria.createdAfter = query.dateRange.start;
        criteria.createdBefore = query.dateRange.end;
      }

      // Get notifications and total count
      const [notifications, total] = await Promise.all([
        this.notificationRepository.findByCriteria(criteria),
        this.notificationRepository.countByCriteria(criteria)
      ]);

      const notificationDTOs = notifications.map(n => this.mapToDTO(n));
      const hasMore = (query.offset || 0) + notifications.length < total;

      return {
        notifications: notificationDTOs,
        total,
        hasMore
      };

    } catch (error) {
      throw new Error(`Lỗi khi lấy thông báo theo người nhận: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle search notifications query
   */
  public async handleSearchNotifications(query: SearchNotificationsQuery): Promise<{
    notifications: NotificationDTO[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const [notifications, total] = await Promise.all([
        this.notificationRepository.findByCriteria(query.criteria),
        this.notificationRepository.countByCriteria(query.criteria)
      ]);

      const notificationDTOs = notifications.map(n => this.mapToDTO(n));
      const hasMore = (query.criteria.offset || 0) + notifications.length < total;

      return {
        notifications: notificationDTOs,
        total,
        hasMore
      };

    } catch (error) {
      throw new Error(`Lỗi khi tìm kiếm thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle get notification history query
   */
  public async handleGetNotificationHistory(query: GetNotificationHistoryQuery): Promise<{
    history: Array<{
      notificationId: string;
      templateType: string;
      status: string;
      priority: string;
      channels: string[];
      scheduledAt: Date;
      sentAt?: Date;
      deliveryResults?: Array<{
        channel: string;
        status: string;
        deliveredAt?: Date;
        errorMessage?: string;
      }>;
      content?: {
        subject?: string;
        preview: string;
      };
    }>;
    total: number;
  }> {
    try {
      if (!query.recipientId?.trim()) {
        throw new Error('Mã người nhận không được để trống');
      }

      const notifications = await this.notificationRepository.getRecipientHistory(
        query.recipientId,
        query.limit || 50,
        query.offset || 0
      );

      const total = await this.notificationRepository.countByRecipient(query.recipientId);

      const history = notifications.map(notification => {
        const deliveryAttempts = notification.getDeliveryAttempts();
        const latestAttempt = deliveryAttempts[deliveryAttempts.length - 1];

        return {
          notificationId: notification.getId().getValue(),
          templateType: notification.getTemplate().getTemplateType(),
          status: notification.getStatus(),
          priority: notification.getPriority(),
          channels: notification.getChannels().map(c => c.getType()),
          scheduledAt: notification.getScheduledAt(),
          sentAt: notification.getSentAt(),
          deliveryResults: latestAttempt?.results.map(result => ({
            channel: result.channel,
            status: result.status,
            deliveredAt: result.deliveredAt,
            errorMessage: result.failureReason
          })),
          content: query.includeContent ? {
            subject: notification.getContent().getSubject(),
            preview: notification.getContent().getPreview(20)
          } : undefined
        };
      });

      return { history, total };

    } catch (error) {
      throw new Error(`Lỗi khi lấy lịch sử thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle get notification analytics query
   */
  public async handleGetNotificationAnalytics(query: GetNotificationAnalyticsQuery): Promise<NotificationAnalyticsDTO> {
    try {
      // Get basic statistics
      const statistics = await this.notificationRepository.getStatistics(query.dateRange);

      // Get delivery metrics
      const deliveryMetrics = await this.notificationRepository.getDeliveryMetrics({
        createdAfter: query.dateRange.start,
        createdBefore: query.dateRange.end,
        ...query.filters
      });

      // Get notification trends
      const trends = await this.notificationRepository.getNotificationTrends(
        Math.ceil((query.dateRange.end.getTime() - query.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
      );

      // Get delivery service analytics
      const deliveryAnalytics = await this.deliveryService.getDeliveryAnalytics(query.dateRange);

      // Calculate performance metrics
      const averageDeliveryTimeByChannel: Record<string, number> = {};
      const successRateByChannel: Record<string, number> = {};

      Object.entries(deliveryAnalytics.channelPerformance).forEach(([channel, performance]) => {
        averageDeliveryTimeByChannel[channel] = performance.averageDeliveryTime;
        successRateByChannel[channel] = performance.successRate;
      });

      // Calculate retry statistics
      const retryStatistics = {
        totalRetries: deliveryMetrics.reduce((sum, metric) => sum + metric.retryAttempts, 0),
        averageRetries: deliveryMetrics.length > 0 
          ? Math.round(deliveryMetrics.reduce((sum, metric) => sum + metric.retryAttempts, 0) / deliveryMetrics.length * 100) / 100
          : 0,
        maxRetries: Math.max(...deliveryMetrics.map(metric => metric.retryAttempts), 0)
      };

      return {
        summary: {
          totalNotifications: statistics.totalNotifications,
          successfulDeliveries: deliveryAnalytics.deliveryTrends.reduce((sum, trend) => sum + trend.successful, 0),
          failedDeliveries: deliveryAnalytics.deliveryTrends.reduce((sum, trend) => sum + trend.failed, 0),
          successRate: statistics.successRate,
          averageDeliveryTime: statistics.averageDeliveryTime
        },
        trends: trends.map(trend => ({
          date: trend.date,
          total: trend.total,
          successful: trend.successful,
          failed: trend.failed,
          successRate: trend.total > 0 ? Math.round((trend.successful / trend.total) * 100) : 0
        })),
        breakdowns: {
          byStatus: statistics.byStatus,
          byPriority: statistics.byPriority,
          byChannel: statistics.byChannel,
          byTemplateType: statistics.byTemplateType,
          byRecipientType: {} // Would need additional data to populate this
        },
        performance: {
          averageDeliveryTimeByChannel,
          successRateByChannel,
          peakHours: deliveryAnalytics.peakHours
        },
        failures: {
          topFailureReasons: statistics.failureReasons,
          failuresByChannel: {}, // Would need additional data to populate this
          retryStatistics
        }
      };

    } catch (error) {
      throw new Error(`Lỗi khi lấy phân tích thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get dashboard summary
   */
  public async getDashboardSummary(): Promise<{
    totalNotifications: number;
    pendingNotifications: number;
    failedNotifications: number;
    successRate: number;
    recentActivity: Array<{
      notificationId: string;
      recipientType: string;
      templateType: string;
      status: string;
      createdAt: Date;
    }>;
    alerts: Array<{
      type: 'WARNING' | 'ERROR' | 'INFO';
      message: string;
      count?: number;
    }>;
  }> {
    try {
      // Get basic counts
      const [
        totalNotifications,
        pendingNotifications,
        failedNotifications,
        recentNotifications,
        overdueNotifications,
        statistics
      ] = await Promise.all([
        this.notificationRepository.countByCriteria({}),
        this.notificationRepository.countByStatus('SCHEDULED'),
        this.notificationRepository.countByStatus('FAILED'),
        this.notificationRepository.getRecentNotifications(10),
        this.notificationRepository.findOverdueNotifications(3600000), // 1 hour
        this.notificationRepository.getStatistics()
      ]);

      // Map recent activity
      const recentActivity = recentNotifications.map(notification => ({
        notificationId: notification.getId().getValue(),
        recipientType: notification.getRecipient().getRecipientType(),
        templateType: notification.getTemplate().getTemplateType(),
        status: notification.getStatus(),
        createdAt: notification.getCreatedAt()
      }));

      // Generate alerts
      const alerts: Array<{ type: 'WARNING' | 'ERROR' | 'INFO'; message: string; count?: number }> = [];

      if (overdueNotifications.length > 0) {
        alerts.push({
          type: 'WARNING',
          message: 'Có thông báo quá hạn cần xử lý',
          count: overdueNotifications.length
        });
      }

      if (failedNotifications > 50) {
        alerts.push({
          type: 'ERROR',
          message: 'Số lượng thông báo thất bại cao',
          count: failedNotifications
        });
      }

      if (statistics.successRate < 90) {
        alerts.push({
          type: 'WARNING',
          message: `Tỷ lệ thành công thấp (${statistics.successRate}%)`
        });
      }

      if (pendingNotifications > 1000) {
        alerts.push({
          type: 'INFO',
          message: 'Hàng đợi thông báo đang cao',
          count: pendingNotifications
        });
      }

      return {
        totalNotifications,
        pendingNotifications,
        failedNotifications,
        successRate: statistics.successRate,
        recentActivity,
        alerts
      };

    } catch (error) {
      throw new Error(`Lỗi khi lấy tóm tắt dashboard: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Map notification aggregate to DTO
   */
  private mapToDTO(notification: NotificationAggregate): NotificationDTO {
    return {
      notificationId: notification.getId().getValue(),
      recipientId: notification.getRecipient().getRecipientId(),
      recipientType: notification.getRecipient().getRecipientType(),
      recipientName: notification.getRecipient().getFullName(),
      templateType: notification.getTemplate().getTemplateType(),
      templateName: notification.getTemplate().getName(),
      status: notification.getStatus(),
      priority: notification.getPriority(),
      channels: notification.getChannels().map(c => c.getType()),
      scheduledAt: notification.getScheduledAt(),
      sentAt: notification.getSentAt(),
      expiresAt: notification.getExpiresAt(),
      deliveryAttempts: notification.getDeliveryAttempts().length,
      retryCount: notification.getRetryCount(),
      nextRetryAt: notification.getNextRetryAt(),
      successRate: notification.getSuccessRate(),
      createdAt: notification.getCreatedAt(),
      updatedAt: notification.getUpdatedAt(),
      content: {
        subject: notification.getContent().getSubject(),
        preview: notification.getContent().getPreview(50),
        hasAttachments: notification.getContent().hasAttachments()
      },
      metadata: notification.getMetadata()
    };
  }
}
