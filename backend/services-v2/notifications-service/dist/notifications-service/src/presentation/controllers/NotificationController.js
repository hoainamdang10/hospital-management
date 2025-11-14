"use strict";
/**
 * NotificationController - Simplified Presentation Controller
 * REST API controller for core notification operations with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, REST API, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
class NotificationController {
    constructor(notificationService, markAsReadUseCase, getUserNotificationsUseCase, updatePreferencesUseCase) {
        this.notificationService = notificationService;
        this.markAsReadUseCase = markAsReadUseCase;
        this.getUserNotificationsUseCase = getUserNotificationsUseCase;
        this.updatePreferencesUseCase = updatePreferencesUseCase;
    }
    /**
     * Send notification immediately
     */
    async sendNotification(req, res) {
        try {
            const command = {
                recipientId: req.body.recipientId,
                recipientType: req.body.recipientType,
                title: req.body.title,
                content: req.body.content,
                channels: req.body.channels || ['EMAIL'],
                priority: req.body.priority || 'NORMAL',
                type: req.body.type || 'info',
                metadata: req.body.metadata
            };
            const result = await this.notificationService.sendNotification(command);
            res.status(200).json({
                success: true,
                data: result,
                message: 'Thông báo đã được gửi thành công'
            });
        }
        catch (error) {
            console.error('Error sending notification:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi gửi thông báo',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Get notification by ID
     */
    async getNotification(req, res) {
        try {
            const { notificationId } = req.params;
            const result = await this.notificationService.getNotification(notificationId);
            res.status(200).json({
                success: true,
                data: result,
                message: 'Lấy thông tin thông báo thành công'
            });
        }
        catch (error) {
            console.error('Error getting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thông tin thông báo',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Get user notification preferences
     */
    async getNotificationPreferences(req, res) {
        try {
            const { userId } = req.params;
            const { userType } = req.query;
            const result = await this.notificationService.getNotificationPreferences(userId, userType);
            res.status(200).json({
                success: true,
                data: result,
                message: 'Lấy cấu hình thông báo thành công'
            });
        }
        catch (error) {
            console.error('Error getting notification preferences:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy cấu hình thông báo',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Mark notification as read/unread
     */
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const { userId, isRead = true } = req.body;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'userId là bắt buộc'
                });
                return;
            }
            const result = await this.markAsReadUseCase.execute({
                notificationId: id,
                userId,
                isRead
            });
            res.status(200).json({
                success: true,
                data: result,
                message: result.message
            });
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật trạng thái đọc thông báo',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Get user notifications with pagination and filters
     */
    async getUserNotifications(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 20, offset = 0, status, priority, startDate, endDate } = req.query;
            const result = await this.getUserNotificationsUseCase.execute({
                userId,
                limit: parseInt(limit),
                offset: parseInt(offset),
                status: status,
                priority: priority,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            });
            res.status(200).json({
                success: true,
                data: result,
                message: 'Lấy danh sách thông báo thành công'
            });
        }
        catch (error) {
            console.error('Error getting user notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách thông báo',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Update notification preferences
     */
    async updatePreferences(req, res) {
        try {
            const { userId } = req.params;
            const preferences = req.body;
            const result = await this.updatePreferencesUseCase.execute({
                userId,
                preferences
            });
            res.status(200).json({
                success: true,
                data: result,
                message: 'Cập nhật cấu hình thông báo thành công'
            });
        }
        catch (error) {
            console.error('Error updating notification preferences:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật cấu hình thông báo',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=NotificationController.js.map