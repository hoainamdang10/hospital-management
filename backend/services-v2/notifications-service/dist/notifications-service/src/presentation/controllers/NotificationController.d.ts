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
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationApplicationService);
    /**
     * Send notification immediately
     * POST /api/v1/notifications/send
     */
    sendNotification(req: Request, res: Response): Promise<void>;
    /**
     * Schedule notification for future delivery
     * POST /api/v1/notifications/schedule
     */
    scheduleNotification(req: Request, res: Response): Promise<void>;
    /**
     * Get notification by ID
     * GET /api/v1/notifications/:id
     */
    getNotification(req: Request, res: Response): Promise<void>;
    /**
     * Get notifications by recipient
     * GET /api/v1/notifications/recipient/:recipientId
     */
    getNotificationsByRecipient(req: Request, res: Response): Promise<void>;
    /**
     * Search notifications
     * POST /api/v1/notifications/search
     */
    searchNotifications(req: Request, res: Response): Promise<void>;
    /**
     * Cancel notification
     * PUT /api/v1/notifications/:id/cancel
     */
    cancelNotification(req: Request, res: Response): Promise<void>;
    /**
     * Retry failed notification
     * PUT /api/v1/notifications/:id/retry
     */
    retryNotification(req: Request, res: Response): Promise<void>;
    /**
     * Send bulk notifications
     * POST /api/v1/notifications/bulk
     */
    sendBulkNotifications(req: Request, res: Response): Promise<void>;
    /**
     * Process notification queue
     * POST /api/v1/notifications/process-queue
     */
    processQueue(req: Request, res: Response): Promise<void>;
    /**
     * Get notification analytics
     * GET /api/v1/notifications/analytics
     */
    getAnalytics(req: Request, res: Response): Promise<void>;
    /**
     * Get dashboard summary
     * GET /api/v1/notifications/dashboard
     */
    getDashboard(req: Request, res: Response): Promise<void>;
    /**
     * Get service health
     * GET /api/v1/notifications/health
     */
    getHealth(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=NotificationController.d.ts.map