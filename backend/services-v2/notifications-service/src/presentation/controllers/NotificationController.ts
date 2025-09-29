/**
 * NotificationController - Presentation Controller
 * REST API controller for notification operations with Vietnamese healthcare context
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API, Vietnamese Healthcare Standards
 */

import { Request, Response } from 'express';
import { NotificationApplicationService } from '../../application/services/NotificationApplicationService';
import { SendNotificationCommand } from '../../application/use-cases/SendNotificationUseCase';
import { ScheduleNotificationCommand } from '../../application/use-cases/ScheduleNotificationUseCase';
import { ProcessQueueCommand } from '../../application/use-cases/ProcessNotificationQueueUseCase';

export class NotificationController {
  constructor(
    private readonly notificationService: NotificationApplicationService
  ) {}

  /**
   * Send notification immediately
   * POST /api/v1/notifications/send
   */
  public async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const command: SendNotificationCommand = {
        recipientId: req.body.recipientId,
        recipientType: req.body.recipientType,
        templateType: req.body.templateType,
        templateData: req.body.templateData || {},
        channels: req.body.channels,
        priority: req.body.priority || 'NORMAL',
        scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        metadata: {
          ...req.body.metadata,
          userId: req.user?.id,
          sessionId: req.sessionID,
          source: 'API',
          requestId: req.headers['x-request-id'] as string
        }
      };

      const result = await this.notificationService.sendNotification(command);

      res.status(201).json({
        success: true,
        message: 'Thông báo đã được gửi thành công',
        data: {
          notificationId: result.notificationId,
          status: result.status,
          channels: result.channels,
          deliveryResults: result.deliveryResults,
          estimatedDeliveryTime: result.estimatedDeliveryTime
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Lỗi khi gửi thông báo',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Schedule notification for future delivery
   * POST /api/v1/notifications/schedule
   */
  public async scheduleNotification(req: Request, res: Response): Promise<void> {
    try {
      const command: ScheduleNotificationCommand = {
        recipientId: req.body.recipientId,
        recipientType: req.body.recipientType,
        templateType: req.body.templateType,
        templateData: req.body.templateData || {},
        channels: req.body.channels,
        priority: req.body.priority || 'NORMAL',
        scheduledAt: new Date(req.body.scheduledAt),
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        recurrence: req.body.recurrence,
        metadata: {
          ...req.body.metadata,
          userId: req.user?.id,
          sessionId: req.sessionID,
          source: 'API',
          requestId: req.headers['x-request-id'] as string
        }
      };

      const result = await this.notificationService.scheduleNotification(command);

      res.status(201).json({
        success: true,
        message: 'Thông báo đã được lên lịch thành công',
        data: {
          notificationId: result.notificationId,
          scheduledAt: result.scheduledAt,
          status: result.status,
          channels: result.channels,
          recurrence: result.recurrence,
          nextScheduledNotifications: result.nextScheduledNotifications
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Lỗi khi lên lịch thông báo',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get notification by ID
   * GET /api/v1/notifications/:id
   */
  public async getNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = req.params.id;
      const notification = await this.notificationService.getNotification(notificationId);

      if (!notification) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Lấy thông báo thành công',
        data: notification,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông báo',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get notifications by recipient
   * GET /api/v1/notifications/recipient/:recipientId
   */
  public async getNotificationsByRecipient(req: Request, res: Response): Promise<void> {
    try {
      const recipientId = req.params.recipientId;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      
      let dateRange: { start: Date; end: Date } | undefined;
      if (req.query.startDate && req.query.endDate) {
        dateRange = {
          start: new Date(req.query.startDate as string),
          end: new Date(req.query.endDate as string)
        };
      }

      const result = await this.notificationService.getNotificationsByRecipient(recipientId, {
        limit,
        offset,
        status,
        priority,
        dateRange
      });

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách thông báo thành công',
        data: {
          notifications: result.notifications,
          pagination: {
            total: result.total,
            limit,
            offset,
            hasMore: result.hasMore
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách thông báo',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Search notifications
   * POST /api/v1/notifications/search
   */
  public async searchNotifications(req: Request, res: Response): Promise<void> {
    try {
      const criteria = req.body;
      const result = await this.notificationService.searchNotifications(criteria);

      res.status(200).json({
        success: true,
        message: 'Tìm kiếm thông báo thành công',
        data: {
          notifications: result.notifications,
          pagination: {
            total: result.total,
            limit: criteria.limit || 20,
            offset: criteria.offset || 0,
            hasMore: result.hasMore
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tìm kiếm thông báo',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Cancel notification
   * PUT /api/v1/notifications/:id/cancel
   */
  public async cancelNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = req.params.id;
      const reason = req.body.reason;
      const userId = req.user?.id;

      const result = await this.notificationService.cancelNotification(notificationId, reason, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          notificationId: result.notificationId,
          status: result.status
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Lỗi khi hủy thông báo',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Retry failed notification
   * PUT /api/v1/notifications/:id/retry
   */
  public async retryNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = req.params.id;
      const channels = req.body.channels;
      const userId = req.user?.id;

      const result = await this.notificationService.retryNotification(notificationId, channels, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          notificationId: result.notificationId,
          status: result.status,
          retryAttempt: result.retryAttempt
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Lỗi khi thử lại thông báo',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send bulk notifications
   * POST /api/v1/notifications/bulk
   */
  public async sendBulkNotifications(req: Request, res: Response): Promise<void> {
    try {
      const command = {
        ...req.body,
        metadata: {
          ...req.body.metadata,
          userId: req.user?.id,
          sessionId: req.sessionID,
          source: 'API',
          requestId: req.headers['x-request-id'] as string
        }
      };

      const result = await this.notificationService.sendBulkNotifications(command);

      res.status(201).json({
        success: true,
        message: `Đã gửi thông báo hàng loạt: ${result.successful}/${result.totalRequested} thành công`,
        data: {
          totalRequested: result.totalRequested,
          successful: result.successful,
          failed: result.failed,
          results: result.results
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Lỗi khi gửi thông báo hàng loạt',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Process notification queue
   * POST /api/v1/notifications/process-queue
   */
  public async processQueue(req: Request, res: Response): Promise<void> {
    try {
      const command: ProcessQueueCommand = {
        batchSize: req.body.batchSize,
        priorityFilter: req.body.priorityFilter,
        maxProcessingTime: req.body.maxProcessingTime,
        onlyExpiredNotifications: req.body.onlyExpiredNotifications
      };

      const result = await this.notificationService.processQueue(command);

      res.status(200).json({
        success: true,
        message: `Đã xử lý ${result.totalProcessed} thông báo trong ${result.processingTime}ms`,
        data: {
          totalProcessed: result.totalProcessed,
          successful: result.successful,
          failed: result.failed,
          expired: result.expired,
          remaining: result.remaining,
          processingTime: result.processingTime,
          statistics: result.statistics,
          details: result.details
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý hàng đợi thông báo',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get notification analytics
   * GET /api/v1/notifications/analytics
   */
  public async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      const options = {
        groupBy: req.query.groupBy as 'day' | 'week' | 'month',
        filters: {
          recipientType: req.query.recipientType as string,
          templateType: req.query.templateType as string,
          channel: req.query.channel as string,
          priority: req.query.priority as string,
          status: req.query.status as string
        }
      };

      const analytics = await this.notificationService.getNotificationAnalytics({ start: startDate, end: endDate }, options);

      res.status(200).json({
        success: true,
        message: 'Lấy phân tích thông báo thành công',
        data: analytics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy phân tích thông báo',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get dashboard summary
   * GET /api/v1/notifications/dashboard
   */
  public async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await this.notificationService.getDashboardSummary();

      res.status(200).json({
        success: true,
        message: 'Lấy tóm tắt dashboard thành công',
        data: dashboard,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tóm tắt dashboard',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get service health
   * GET /api/v1/notifications/health
   */
  public async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.notificationService.getHealthStatus();

      const statusCode = health.isHealthy ? 200 : 503;

      res.status(statusCode).json({
        success: health.isHealthy,
        message: health.isHealthy ? 'Dịch vụ hoạt động bình thường' : 'Dịch vụ có vấn đề',
        data: health,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Lỗi khi kiểm tra sức khỏe dịch vụ',
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
        timestamp: new Date().toISOString()
      });
    }
  }
}
