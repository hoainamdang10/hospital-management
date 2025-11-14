/**
 * NotificationController - Simplified Presentation Controller
 * REST API controller for core notification operations with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, REST API, Vietnamese Healthcare Standards
 */
import { Request, Response } from 'express';
import { NotificationApplicationService } from '../../application/services/NotificationApplicationService';
import { MarkNotificationAsReadUseCase } from '../../application/use-cases/MarkNotificationAsReadUseCase';
import { GetUserNotificationsUseCase } from '../../application/use-cases/GetUserNotificationsUseCase';
import { UpdateNotificationPreferencesUseCase } from '../../application/use-cases/UpdateNotificationPreferencesUseCase';
export declare class NotificationController {
    private readonly notificationService;
    private readonly markAsReadUseCase;
    private readonly getUserNotificationsUseCase;
    private readonly updatePreferencesUseCase;
    constructor(notificationService: NotificationApplicationService, markAsReadUseCase: MarkNotificationAsReadUseCase, getUserNotificationsUseCase: GetUserNotificationsUseCase, updatePreferencesUseCase: UpdateNotificationPreferencesUseCase);
    /**
     * Send notification immediately
     */
    sendNotification(req: Request, res: Response): Promise<void>;
    /**
     * Get notification by ID
     */
    getNotification(req: Request, res: Response): Promise<void>;
    /**
     * Get user notification preferences
     */
    getNotificationPreferences(req: Request, res: Response): Promise<void>;
    /**
     * Mark notification as read/unread
     */
    markAsRead(req: Request, res: Response): Promise<void>;
    /**
     * Get user notifications with pagination and filters
     */
    getUserNotifications(req: Request, res: Response): Promise<void>;
    /**
     * Update notification preferences
     */
    updatePreferences(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=NotificationController.d.ts.map