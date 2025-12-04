"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const MarkNotificationAsReadUseCase_1 = require("../../application/use-cases/MarkNotificationAsReadUseCase");
class NotificationController {
    constructor(getNotificationsByRecipientUseCase, getUserNotificationsUseCase, markNotificationAsReadUseCase, getUnreadNotificationsCountUseCase) {
        this.getNotificationsByRecipientUseCase = getNotificationsByRecipientUseCase;
        this.getUserNotificationsUseCase = getUserNotificationsUseCase;
        this.markNotificationAsReadUseCase = markNotificationAsReadUseCase;
        this.getUnreadNotificationsCountUseCase = getUnreadNotificationsCountUseCase;
        /**
         * Legacy endpoint: keep for patient registry compatibility
         */
        this.getPatientNotifications = async (req, res) => {
            try {
                const { patientId } = req.params;
                const limit = req.query.limit
                    ? parseInt(req.query.limit, 10)
                    : 10;
                const offset = req.query.offset
                    ? parseInt(req.query.offset, 10)
                    : 0;
                const result = await this.getNotificationsByRecipientUseCase.execute({
                    recipientId: patientId,
                    limit,
                    offset,
                });
                res.json({
                    success: true,
                    data: {
                        notifications: result.notifications,
                        pagination: {
                            total: result.total,
                            page: Math.floor(offset / limit) + 1,
                            limit: result.pagination.limit,
                            totalPages: Math.ceil(result.total / limit),
                        },
                    },
                });
            }
            catch (error) {
                console.error("Error getting patient notifications:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to get notifications",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        };
        /**
         * Unified endpoint cho mọi user (patient/staff/admin)
         */
        this.getUserNotifications = async (req, res) => {
            try {
                const { userId } = req.params;
                const { limit = "20", offset = "0", status = "all", priority, startDate, endDate, notificationId, } = req.query;
                const result = await this.getUserNotificationsUseCase.execute({
                    userId,
                    limit: parseInt(limit, 10),
                    offset: parseInt(offset, 10),
                    status: status,
                    priority: priority,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                    notificationId: typeof notificationId === "string" ? notificationId : undefined,
                });
                res.json({
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                console.error("Error getting user notifications:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to get notifications",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        };
        this.getUnreadCount = async (req, res) => {
            try {
                const { userId } = req.params;
                const result = await this.getUnreadNotificationsCountUseCase.execute({
                    userId,
                });
                res.json({
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                console.error("Error getting unread count:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to get unread count",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        };
        this.markNotificationAsRead = async (req, res) => {
            try {
                const { notificationId } = req.params;
                const { userId, isRead = true } = req.body;
                if (!userId) {
                    res.status(400).json({
                        success: false,
                        message: "userId is required",
                    });
                    return;
                }
                const result = await this.markNotificationAsReadUseCase.execute({
                    notificationId,
                    userId,
                    isRead,
                });
                res.json({
                    success: true,
                    data: result,
                    message: result.message,
                });
            }
            catch (error) {
                console.error("Error marking notification as read:", error);
                if (error instanceof MarkNotificationAsReadUseCase_1.NotificationNotFoundError) {
                    res.status(404).json({
                        success: false,
                        message: "Notification not found",
                    });
                    return;
                }
                if (error instanceof MarkNotificationAsReadUseCase_1.NotificationAccessDeniedError) {
                    res.status(403).json({
                        success: false,
                        message: "You are not allowed to update this notification",
                    });
                    return;
                }
                res.status(500).json({
                    success: false,
                    message: "Failed to update notification status",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        };
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=NotificationController.js.map