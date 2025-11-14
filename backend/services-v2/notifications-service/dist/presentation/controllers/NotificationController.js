"use strict";
/**
 * NotificationController - Presentation Controller
 * REST API controller for notification operations with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    /**
     * Send notification immediately
     * POST /api/v1/notifications/send
     */
    async sendNotification(req, res) {
        try {
            const command = {
                recipientId: req.body.recipientId,
                recipientType: req.body.recipientType,
                templateType: req.body.templateType,
                templateData: req.body.templateData || {},
                channels: req.body.channels,
                priority: req.body.priority || 'NORMAL',
                metadata: {
                    ...req.body.metadata,
                    userId: req.user?.id,
                    source: 'API',
                    requestId: req.headers['x-request-id'],
                    scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
                    expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
                }
            };
            const result = await this.notificationService.sendNotification(command);
            res.status(201).json({
                success: true,
                message: 'Thông báo đã được gửi thành công',
                data: {
                    notificationId: result.notificationId,
                    status: result.status,
                    deliveryResults: result.deliveryResults
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
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
    async scheduleNotification(req, res) {
        try {
            const command = {
                recipientId: req.body.recipientId,
                recipientType: req.body.recipientType,
                templateType: req.body.templateType,
                templateData: req.body.templateData || {},
                channels: req.body.channels,
                priority: req.body.priority || 'NORMAL',
                metadata: {
                    ...req.body.metadata,
                    userId: req.user?.id,
                    source: 'API',
                    requestId: req.headers['x-request-id'],
                    scheduledAt: new Date(req.body.scheduledAt),
                    expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
                    recurrence: req.body.recurrence
                }
            };
            const result = await this.notificationService.scheduleNotification(command);
            res.status(201).json({
                success: true,
                message: 'Thông báo đã được lên lịch thành công',
                data: {
                    notificationId: result.notificationId || result.notificationId,
                    scheduledAt: req.body.scheduledAt,
                    status: result.status
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
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
    async getNotification(req, res) {
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
        }
        catch (error) {
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
    async getNotificationsByRecipient(req, res) {
        try {
            const recipientId = req.params.recipientId;
            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;
            const status = req.query.status;
            const priority = req.query.priority;
            let dateRange;
            if (req.query.startDate && req.query.endDate) {
                dateRange = {
                    start: new Date(req.query.startDate),
                    end: new Date(req.query.endDate)
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
        }
        catch (error) {
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
    async searchNotifications(req, res) {
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
        }
        catch (error) {
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
    async cancelNotification(req, res) {
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
        }
        catch (error) {
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
    async retryNotification(req, res) {
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
        }
        catch (error) {
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
    async sendBulkNotifications(req, res) {
        try {
            const command = {
                ...req.body,
                metadata: {
                    ...req.body.metadata,
                    userId: req.user?.id,
                    source: 'API',
                    requestId: req.headers['x-request-id']
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
        }
        catch (error) {
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
    async processQueue(req, res) {
        try {
            const command = {
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
        }
        catch (error) {
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
    async getAnalytics(req, res) {
        try {
            const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
            const options = {
                groupBy: req.query.groupBy,
                filters: {
                    recipientType: req.query.recipientType,
                    templateType: req.query.templateType,
                    channel: req.query.channel,
                    priority: req.query.priority,
                    status: req.query.status
                }
            };
            const analytics = await this.notificationService.getNotificationAnalytics({ start: startDate, end: endDate }, options);
            res.status(200).json({
                success: true,
                message: 'Lấy phân tích thông báo thành công',
                data: analytics,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
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
    async getDashboard(_req, res) {
        try {
            const dashboard = await this.notificationService.getDashboardSummary();
            res.status(200).json({
                success: true,
                message: 'Lấy tóm tắt dashboard thành công',
                data: dashboard,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
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
    async getHealth(_req, res) {
        try {
            const health = await this.notificationService.getHealthStatus();
            const statusCode = health.isHealthy ? 200 : 503;
            res.status(statusCode).json({
                success: health.isHealthy,
                message: health.isHealthy ? 'Dịch vụ hoạt động bình thường' : 'Dịch vụ có vấn đề',
                data: health,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            res.status(503).json({
                success: false,
                message: 'Lỗi khi kiểm tra sức khỏe dịch vụ',
                error: error instanceof Error ? error.message : 'Lỗi không xác định',
                timestamp: new Date().toISOString()
            });
        }
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=NotificationController.js.map