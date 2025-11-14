/**
 * NotificationApplicationService - Complete Application Service
 * Orchestrates all notification operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Full Implementation
 */
import { SendNotificationUseCase, SendNotificationCommand, SendNotificationResult } from '../use-cases/SendNotificationUseCase';
import { GetNotificationUseCase } from '../use-cases/GetNotificationUseCase';
import { GetNotificationsByRecipientUseCase } from '../use-cases/GetNotificationsByRecipientUseCase';
import { SearchNotificationsUseCase, SearchNotificationsCommand } from '../use-cases/SearchNotificationsUseCase';
import { CancelNotificationUseCase } from '../use-cases/CancelNotificationUseCase';
import { RetryNotificationUseCase } from '../use-cases/RetryNotificationUseCase';
import { SendBulkNotificationsUseCase, SendBulkNotificationsCommand } from '../use-cases/SendBulkNotificationsUseCase';
import { ProcessNotificationQueueUseCase, ProcessQueueCommand } from '../use-cases/ProcessNotificationQueueUseCase';
import { GetNotificationAnalyticsUseCase } from '../use-cases/GetNotificationAnalyticsUseCase';
import { GetDashboardSummaryUseCase } from '../use-cases/GetDashboardSummaryUseCase';
import { GetHealthStatusUseCase } from '../use-cases/GetHealthStatusUseCase';
import { UpdateNotificationPreferencesUseCase, UpdatePreferencesCommand } from '../use-cases/UpdateNotificationPreferencesUseCase';
import { GetNotificationPreferencesUseCase } from '../use-cases/GetNotificationPreferencesUseCase';
export declare class NotificationApplicationService {
    private readonly sendNotificationUseCase;
    private readonly getNotificationUseCase;
    private readonly getNotificationsByRecipientUseCase;
    private readonly searchNotificationsUseCase;
    private readonly cancelNotificationUseCase;
    private readonly retryNotificationUseCase;
    private readonly sendBulkNotificationsUseCase;
    private readonly processNotificationQueueUseCase;
    private readonly getNotificationAnalyticsUseCase;
    private readonly getDashboardSummaryUseCase;
    private readonly getHealthStatusUseCase;
    private readonly updateNotificationPreferencesUseCase;
    private readonly getNotificationPreferencesUseCase;
    constructor(sendNotificationUseCase: SendNotificationUseCase, getNotificationUseCase: GetNotificationUseCase, getNotificationsByRecipientUseCase: GetNotificationsByRecipientUseCase, searchNotificationsUseCase: SearchNotificationsUseCase, cancelNotificationUseCase: CancelNotificationUseCase, retryNotificationUseCase: RetryNotificationUseCase, sendBulkNotificationsUseCase: SendBulkNotificationsUseCase, processNotificationQueueUseCase: ProcessNotificationQueueUseCase, getNotificationAnalyticsUseCase: GetNotificationAnalyticsUseCase, getDashboardSummaryUseCase: GetDashboardSummaryUseCase, getHealthStatusUseCase: GetHealthStatusUseCase, updateNotificationPreferencesUseCase: UpdateNotificationPreferencesUseCase, getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase);
    /**
     * Send notification immediately
     */
    sendNotification(command: SendNotificationCommand): Promise<SendNotificationResult>;
    /**
     * Schedule notification for future delivery
     * Note: Actual scheduling is handled by Scheduler Service
     * This creates a SCHEDULED notification that will be picked up
     */
    scheduleNotification(command: any): Promise<any>;
    /**
     * Get notification by ID
     */
    getNotification(notificationId: string): Promise<any>;
    /**
     * Get notifications by recipient
     */
    getNotificationsByRecipient(recipientId: string, options?: any): Promise<any>;
    /**
     * Search notifications
     */
    searchNotifications(criteria: SearchNotificationsCommand): Promise<any>;
    /**
     * Cancel notification
     */
    cancelNotification(notificationId: string, reason?: string, userId?: string): Promise<any>;
    /**
     * Retry failed notification
     */
    retryNotification(notificationId: string, channels?: string[], userId?: string): Promise<any>;
    /**
     * Send bulk notifications
     */
    sendBulkNotifications(command: SendBulkNotificationsCommand): Promise<any>;
    /**
     * Process notification queue
     */
    processQueue(command: ProcessQueueCommand): Promise<any>;
    /**
     * Get notification analytics
     */
    getNotificationAnalytics(dateRange: {
        start: Date;
        end: Date;
    }, options?: any): Promise<any>;
    /**
     * Get dashboard summary
     */
    getDashboardSummary(): Promise<any>;
    /**
     * Get service health status
     */
    getHealthStatus(): Promise<any>;
    /**
     * Get user preferences
     */
    getPreferences(userId: string): Promise<any>;
    /**
     * Update user preferences
     */
    updatePreferences(command: UpdatePreferencesCommand): Promise<any>;
}
//# sourceMappingURL=NotificationApplicationService.d.ts.map