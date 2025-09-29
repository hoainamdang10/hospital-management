/**
 * SupabaseNotificationRepositoryExtensions - Additional Repository Methods
 * Extended methods for SupabaseNotificationRepository
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern, Vietnamese Healthcare Standards
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NotificationStatistics, DeliveryMetrics, NotificationPriority, NotificationStatus } from '../../domain/repositories/INotificationRepository';
import { NotificationAggregate } from '../../domain/aggregates/NotificationAggregate';
import { NotificationId } from '../../domain/value-objects/NotificationId';

export class SupabaseNotificationRepositoryExtensions {
  private readonly supabase: SupabaseClient;
  private readonly schema = 'notifications_schema';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Thiếu cấu hình Supabase URL hoặc Service Role Key');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: this.schema },
      auth: { persistSession: false }
    });
  }

  /**
   * Get notification statistics
   */
  public async getStatistics(dateRange?: { start: Date; end: Date }): Promise<NotificationStatistics> {
    try {
      let query = this.supabase.from('notifications').select('*');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi lấy thống kê thông báo: ${error.message}`);
      }

      const notifications = data || [];
      const total = notifications.length;

      // Calculate statistics
      const byStatus: Record<string, number> = {};
      const byPriority: Record<string, number> = {};
      const byChannel: Record<string, number> = {};
      const byTemplateType: Record<string, number> = {};
      const failureReasons: Record<string, number> = {};
      const deliveryTimes: number[] = [];

      let successfulDeliveries = 0;

      notifications.forEach(notification => {
        // Count by status
        byStatus[notification.status] = (byStatus[notification.status] || 0) + 1;

        // Count by priority
        byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;

        // Count by template type
        byTemplateType[notification.template_type] = (byTemplateType[notification.template_type] || 0) + 1;

        // Count by channels
        notification.channels.forEach((channel: string) => {
          byChannel[channel] = (byChannel[channel] || 0) + 1;
        });

        // Count successful deliveries
        if (notification.status === 'SENT' || notification.status === 'DELIVERED') {
          successfulDeliveries++;
        }

        // Collect delivery times
        if (notification.sent_at && notification.scheduled_at) {
          const deliveryTime = new Date(notification.sent_at).getTime() - new Date(notification.scheduled_at).getTime();
          deliveryTimes.push(deliveryTime);
        }

        // Collect failure reasons
        if (notification.delivery_attempts && notification.delivery_attempts.length > 0) {
          const lastAttempt = notification.delivery_attempts[notification.delivery_attempts.length - 1];
          if (lastAttempt.results) {
            lastAttempt.results.forEach((result: any) => {
              if (result.status === 'FAILED' && result.failureReason) {
                failureReasons[result.failureReason] = (failureReasons[result.failureReason] || 0) + 1;
              }
            });
          }
        }
      });

      const successRate = total > 0 ? Math.round((successfulDeliveries / total) * 100) : 0;
      const averageDeliveryTime = deliveryTimes.length > 0 
        ? Math.round(deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length)
        : 0;

      // Calculate recent activity
      const now = new Date();
      const last24Hours = notifications.filter(n => 
        new Date(n.created_at).getTime() > now.getTime() - 24 * 60 * 60 * 1000
      ).length;

      const lastWeek = notifications.filter(n => 
        new Date(n.created_at).getTime() > now.getTime() - 7 * 24 * 60 * 60 * 1000
      ).length;

      const lastMonth = notifications.filter(n => 
        new Date(n.created_at).getTime() > now.getTime() - 30 * 24 * 60 * 60 * 1000
      ).length;

      return {
        totalNotifications: total,
        byStatus,
        byPriority,
        byChannel,
        byTemplateType,
        successRate,
        averageDeliveryTime,
        failureReasons,
        recentActivity: {
          last24Hours,
          lastWeek,
          lastMonth
        }
      };

    } catch (error) {
      throw new Error(`Lỗi repository khi lấy thống kê thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get delivery metrics
   */
  public async getDeliveryMetrics(criteria?: any): Promise<DeliveryMetrics[]> {
    try {
      let query = this.supabase.from('notifications').select('*');

      if (criteria) {
        if (criteria.createdAfter) {
          query = query.gte('created_at', criteria.createdAfter.toISOString());
        }
        if (criteria.createdBefore) {
          query = query.lte('created_at', criteria.createdBefore.toISOString());
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi lấy metrics gửi thông báo: ${error.message}`);
      }

      const notifications = data || [];
      const metrics: DeliveryMetrics[] = [];

      notifications.forEach(notification => {
        if (notification.delivery_attempts && notification.delivery_attempts.length > 0) {
          notification.delivery_attempts.forEach((attempt: any) => {
            const deliveryTime = attempt.completedAt && attempt.startedAt
              ? new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()
              : 0;

            metrics.push({
              notificationId: notification.notification_id,
              recipientType: notification.recipient_type,
              templateType: notification.template_type,
              channels: notification.channels,
              priority: notification.priority,
              attemptNumber: attempt.attemptNumber || 1,
              startedAt: new Date(attempt.startedAt || notification.scheduled_at),
              completedAt: attempt.completedAt ? new Date(attempt.completedAt) : undefined,
              deliveryTime,
              success: attempt.results?.some((r: any) => r.status === 'SENT' || r.status === 'DELIVERED') || false,
              failureReasons: attempt.results?.filter((r: any) => r.status === 'FAILED').map((r: any) => r.failureReason) || [],
              retryAttempts: notification.retry_count || 0
            });
          });
        }
      });

      return metrics;

    } catch (error) {
      throw new Error(`Lỗi repository khi lấy metrics gửi thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get queue size
   */
  public async getQueueSize(priority?: NotificationPriority): Promise<number> {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'SCHEDULED');

      if (priority) {
        query = query.eq('priority', priority);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi lấy kích thước hàng đợi: ${error.message}`);
      }

      return count || 0;

    } catch (error) {
      throw new Error(`Lỗi repository khi lấy kích thước hàng đợi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get average processing time
   */
  public async getAverageProcessingTime(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('scheduled_at, sent_at')
        .not('sent_at', 'is', null)
        .limit(1000);

      if (error) {
        throw new Error(`Lỗi khi lấy thời gian xử lý trung bình: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return 0;
      }

      const processingTimes = data
        .filter(n => n.scheduled_at && n.sent_at)
        .map(n => new Date(n.sent_at).getTime() - new Date(n.scheduled_at).getTime());

      if (processingTimes.length === 0) {
        return 0;
      }

      return Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length);

    } catch (error) {
      throw new Error(`Lỗi repository khi lấy thời gian xử lý trung bình: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Update notification status
   */
  public async updateStatus(id: NotificationId, status: NotificationStatus): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('notification_id', id.getValue());

      if (error) {
        throw new Error(`Lỗi khi cập nhật trạng thái thông báo: ${error.message}`);
      }

    } catch (error) {
      throw new Error(`Lỗi repository khi cập nhật trạng thái thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Update retry information
   */
  public async updateRetryInfo(id: NotificationId, retryCount: number, nextRetryAt: Date): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ 
          retry_count: retryCount,
          next_retry_at: nextRetryAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('notification_id', id.getValue());

      if (error) {
        throw new Error(`Lỗi khi cập nhật thông tin thử lại: ${error.message}`);
      }

    } catch (error) {
      throw new Error(`Lỗi repository khi cập nhật thông tin thử lại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get notification trends
   */
  public async getNotificationTrends(days: number): Promise<Array<{
    date: Date;
    total: number;
    successful: number;
    failed: number;
  }>> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const { data, error } = await this.supabase
        .from('notifications')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Lỗi khi lấy xu hướng thông báo: ${error.message}`);
      }

      // Group by date
      const trends: Record<string, { total: number; successful: number; failed: number }> = {};

      (data || []).forEach(notification => {
        const date = new Date(notification.created_at).toDateString();
        
        if (!trends[date]) {
          trends[date] = { total: 0, successful: 0, failed: 0 };
        }

        trends[date].total++;

        if (notification.status === 'SENT' || notification.status === 'DELIVERED') {
          trends[date].successful++;
        } else if (notification.status === 'FAILED') {
          trends[date].failed++;
        }
      });

      return Object.entries(trends).map(([dateStr, stats]) => ({
        date: new Date(dateStr),
        ...stats
      }));

    } catch (error) {
      throw new Error(`Lỗi repository khi lấy xu hướng thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }
}
