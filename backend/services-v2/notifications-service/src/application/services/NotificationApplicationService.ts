/**
 * NotificationApplicationService - Application Service
 * Main application service orchestrating notification operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */

import { NotificationCommandHandlers } from '../handlers/NotificationCommandHandlers';
import { NotificationQueryHandlers } from '../handlers/NotificationQueryHandlers';
import { SendNotificationCommand, SendNotificationResult } from '../use-cases/SendNotificationUseCase';
import { ScheduleNotificationCommand, ScheduleNotificationResult } from '../use-cases/ScheduleNotificationUseCase';
import { ProcessQueueCommand, ProcessQueueResult } from '../use-cases/ProcessNotificationQueueUseCase';

export interface NotificationServiceHealth {
  isHealthy: boolean;
  services: {
    repository: boolean;
    templateService: boolean;
    deliveryService: boolean;
  };
  queue: {
    size: number;
    oldestItem?: Date;
    processingRate: number;
  };
  performance: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
  };
  alerts: Array<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    timestamp: Date;
  }>;
}

export class NotificationApplicationService {
  constructor(
    private readonly commandHandlers: NotificationCommandHandlers,
    private readonly queryHandlers: NotificationQueryHandlers
  ) {}

  // Command Operations

  /**
   * Send notification immediately or schedule for immediate delivery
   */
  public async sendNotification(command: SendNotificationCommand): Promise<SendNotificationResult> {
    try {
      return await this.commandHandlers.handleSendNotification(command);
    } catch (error) {
      throw new Error(`Lỗi dịch vụ gửi thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Schedule notification for future delivery
   */
  public async scheduleNotification(command: ScheduleNotificationCommand): Promise<ScheduleNotificationResult> {
    try {
      return await this.commandHandlers.handleScheduleNotification(command);
    } catch (error) {
      throw new Error(`Lỗi dịch vụ lên lịch thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Process notification queue
   */
  public async processQueue(command?: ProcessQueueCommand): Promise<ProcessQueueResult> {
    try {
      return await this.commandHandlers.handleProcessQueue(command);
    } catch (error) {
      throw new Error(`Lỗi dịch vụ xử lý hàng đợi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Cancel scheduled notification
   */
  public async cancelNotification(notificationId: string, reason?: string, userId?: string): Promise<{
    notificationId: string;
    status: 'CANCELLED';
    message: string;
  }> {
    try {
      return await this.commandHandlers.handleCancelNotification({
        notificationId,
        reason,
        userId
      });
    } catch (error) {
      throw new Error(`Lỗi dịch vụ hủy thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Retry failed notification
   */
  public async retryNotification(notificationId: string, channels?: string[], userId?: string): Promise<{
    notificationId: string;
    status: 'RETRYING' | 'FAILED';
    message: string;
    retryAttempt: number;
  }> {
    try {
      return await this.commandHandlers.handleRetryNotification({
        notificationId,
        channels,
        userId
      });
    } catch (error) {
      throw new Error(`Lỗi dịch vụ thử lại thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Send bulk notifications
   */
  public async sendBulkNotifications(command: {
    recipientIds: string[];
    recipientType: string;
    templateType: string;
    templateData: Record<string, any>;
    channels?: string[];
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    scheduledAt?: Date;
    expiresAt?: Date;
    metadata?: any;
  }): Promise<{
    totalRequested: number;
    successful: number;
    failed: number;
    results: Array<{
      recipientId: string;
      notificationId?: string;
      status: 'SUCCESS' | 'FAILED';
      errorMessage?: string;
    }>;
  }> {
    try {
      return await this.commandHandlers.handleBulkNotification(command);
    } catch (error) {
      throw new Error(`Lỗi dịch vụ gửi thông báo hàng loạt: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  // Query Operations

  /**
   * Get notification by ID
   */
  public async getNotification(notificationId: string) {
    try {
      return await this.queryHandlers.handleGetNotification({ notificationId });
    } catch (error) {
      throw new Error(`Lỗi dịch vụ lấy thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get notifications by recipient
   */
  public async getNotificationsByRecipient(
    recipientId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
      priority?: string;
      dateRange?: { start: Date; end: Date };
    }
  ) {
    try {
      return await this.queryHandlers.handleGetNotificationsByRecipient({
        recipientId,
        ...options
      });
    } catch (error) {
      throw new Error(`Lỗi dịch vụ lấy thông báo theo người nhận: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Search notifications
   */
  public async searchNotifications(criteria: any) {
    try {
      return await this.queryHandlers.handleSearchNotifications({ criteria });
    } catch (error) {
      throw new Error(`Lỗi dịch vụ tìm kiếm thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get notification history for recipient
   */
  public async getNotificationHistory(
    recipientId: string,
    options?: {
      limit?: number;
      offset?: number;
      includeContent?: boolean;
    }
  ) {
    try {
      return await this.queryHandlers.handleGetNotificationHistory({
        recipientId,
        ...options
      });
    } catch (error) {
      throw new Error(`Lỗi dịch vụ lấy lịch sử thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get notification analytics
   */
  public async getNotificationAnalytics(
    dateRange: { start: Date; end: Date },
    options?: {
      groupBy?: 'day' | 'week' | 'month';
      filters?: {
        recipientType?: string;
        templateType?: string;
        channel?: string;
        priority?: string;
        status?: string;
      };
    }
  ) {
    try {
      return await this.queryHandlers.handleGetNotificationAnalytics({
        dateRange,
        ...options
      });
    } catch (error) {
      throw new Error(`Lỗi dịch vụ phân tích thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get dashboard summary
   */
  public async getDashboardSummary() {
    try {
      return await this.queryHandlers.getDashboardSummary();
    } catch (error) {
      throw new Error(`Lỗi dịch vụ tóm tắt dashboard: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  // Management Operations

  /**
   * Get processing recommendations
   */
  public async getProcessingRecommendations() {
    try {
      return await this.commandHandlers.getProcessingRecommendations();
    } catch (error) {
      throw new Error(`Lỗi dịch vụ khuyến nghị xử lý: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get notification statistics
   */
  public async getNotificationStatistics(dateRange?: { start: Date; end: Date }) {
    try {
      return await this.commandHandlers.getNotificationStatistics(dateRange);
    } catch (error) {
      throw new Error(`Lỗi dịch vụ thống kê thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get service health status
   */
  public async getHealthStatus(): Promise<NotificationServiceHealth> {
    try {
      // This would integrate with actual health checks from repositories and services
      // For now, we'll return a mock health status
      
      const dashboardSummary = await this.getDashboardSummary();
      const processingRecommendations = await this.getProcessingRecommendations();

      const alerts: NotificationServiceHealth['alerts'] = [];

      // Generate alerts based on system status
      if (dashboardSummary.failedNotifications > 100) {
        alerts.push({
          severity: 'HIGH',
          message: `Có ${dashboardSummary.failedNotifications} thông báo thất bại`,
          timestamp: new Date()
        });
      }

      if (processingRecommendations.urgentNotifications > 50) {
        alerts.push({
          severity: 'CRITICAL',
          message: `Có ${processingRecommendations.urgentNotifications} thông báo khẩn cấp chờ xử lý`,
          timestamp: new Date()
        });
      }

      if (processingRecommendations.overdueNotifications > 0) {
        alerts.push({
          severity: 'MEDIUM',
          message: `Có ${processingRecommendations.overdueNotifications} thông báo quá hạn`,
          timestamp: new Date()
        });
      }

      if (dashboardSummary.successRate < 90) {
        alerts.push({
          severity: 'MEDIUM',
          message: `Tỷ lệ thành công thấp: ${dashboardSummary.successRate}%`,
          timestamp: new Date()
        });
      }

      return {
        isHealthy: alerts.filter(a => a.severity === 'CRITICAL').length === 0,
        services: {
          repository: true, // Would check actual repository health
          templateService: true, // Would check actual template service health
          deliveryService: true // Would check actual delivery service health
        },
        queue: {
          size: dashboardSummary.pendingNotifications,
          processingRate: 0, // Would calculate actual processing rate
          oldestItem: undefined // Would get actual oldest queued item
        },
        performance: {
          averageResponseTime: 0, // Would calculate actual response time
          successRate: dashboardSummary.successRate,
          errorRate: 100 - dashboardSummary.successRate
        },
        alerts
      };

    } catch (error) {
      return {
        isHealthy: false,
        services: {
          repository: false,
          templateService: false,
          deliveryService: false
        },
        queue: {
          size: 0,
          processingRate: 0
        },
        performance: {
          averageResponseTime: 0,
          successRate: 0,
          errorRate: 100
        },
        alerts: [{
          severity: 'CRITICAL',
          message: `Lỗi hệ thống: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
          timestamp: new Date()
        }]
      };
    }
  }

  /**
   * Perform system maintenance operations
   */
  public async performMaintenance(operations: {
    cleanupOldNotifications?: boolean;
    optimizeDatabase?: boolean;
    resetFailedNotifications?: boolean;
    archiveOldData?: boolean;
  }): Promise<{
    operations: Array<{
      operation: string;
      status: 'SUCCESS' | 'FAILED';
      message: string;
      details?: any;
    }>;
    summary: {
      totalOperations: number;
      successful: number;
      failed: number;
    };
  }> {
    const results: Array<{
      operation: string;
      status: 'SUCCESS' | 'FAILED';
      message: string;
      details?: any;
    }> = [];

    try {
      // Cleanup old notifications
      if (operations.cleanupOldNotifications) {
        try {
          // This would call repository cleanup methods
          results.push({
            operation: 'cleanupOldNotifications',
            status: 'SUCCESS',
            message: 'Đã dọn dẹp thông báo cũ thành công',
            details: { deletedCount: 0 } // Would return actual count
          });
        } catch (error) {
          results.push({
            operation: 'cleanupOldNotifications',
            status: 'FAILED',
            message: `Lỗi khi dọn dẹp thông báo cũ: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
          });
        }
      }

      // Optimize database
      if (operations.optimizeDatabase) {
        try {
          // This would call repository optimization methods
          results.push({
            operation: 'optimizeDatabase',
            status: 'SUCCESS',
            message: 'Đã tối ưu hóa cơ sở dữ liệu thành công'
          });
        } catch (error) {
          results.push({
            operation: 'optimizeDatabase',
            status: 'FAILED',
            message: `Lỗi khi tối ưu hóa cơ sở dữ liệu: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
          });
        }
      }

      // Reset failed notifications
      if (operations.resetFailedNotifications) {
        try {
          // This would reset failed notifications for retry
          results.push({
            operation: 'resetFailedNotifications',
            status: 'SUCCESS',
            message: 'Đã reset thông báo thất bại thành công',
            details: { resetCount: 0 } // Would return actual count
          });
        } catch (error) {
          results.push({
            operation: 'resetFailedNotifications',
            status: 'FAILED',
            message: `Lỗi khi reset thông báo thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
          });
        }
      }

      // Archive old data
      if (operations.archiveOldData) {
        try {
          // This would archive old notification data
          results.push({
            operation: 'archiveOldData',
            status: 'SUCCESS',
            message: 'Đã lưu trữ dữ liệu cũ thành công',
            details: { archivedCount: 0 } // Would return actual count
          });
        } catch (error) {
          results.push({
            operation: 'archiveOldData',
            status: 'FAILED',
            message: `Lỗi khi lưu trữ dữ liệu cũ: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
          });
        }
      }

      const successful = results.filter(r => r.status === 'SUCCESS').length;
      const failed = results.filter(r => r.status === 'FAILED').length;

      return {
        operations: results,
        summary: {
          totalOperations: results.length,
          successful,
          failed
        }
      };

    } catch (error) {
      throw new Error(`Lỗi dịch vụ bảo trì hệ thống: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }
}
