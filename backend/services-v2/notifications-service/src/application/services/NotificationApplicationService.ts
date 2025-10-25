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

export class NotificationApplicationService {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getNotificationUseCase: GetNotificationUseCase,
    private readonly getNotificationsByRecipientUseCase: GetNotificationsByRecipientUseCase,
    private readonly searchNotificationsUseCase: SearchNotificationsUseCase,
    private readonly cancelNotificationUseCase: CancelNotificationUseCase,
    private readonly retryNotificationUseCase: RetryNotificationUseCase,
    private readonly sendBulkNotificationsUseCase: SendBulkNotificationsUseCase,
    private readonly processNotificationQueueUseCase: ProcessNotificationQueueUseCase,
    private readonly getNotificationAnalyticsUseCase: GetNotificationAnalyticsUseCase,
    private readonly getDashboardSummaryUseCase: GetDashboardSummaryUseCase,
    private readonly getHealthStatusUseCase: GetHealthStatusUseCase,
    private readonly updateNotificationPreferencesUseCase: UpdateNotificationPreferencesUseCase,
    private readonly getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase
  ) {}

  // ==================== Notification Operations ====================

  /**
   * Send notification immediately
   */
  async sendNotification(command: SendNotificationCommand): Promise<SendNotificationResult> {
    return await this.sendNotificationUseCase.execute(command);
  }

  /**
   * Schedule notification for future delivery
   * Note: Actual scheduling is handled by Scheduler Service
   * This creates a SCHEDULED notification that will be picked up
   */
  async scheduleNotification(command: any): Promise<any> {
    // For now, use send notification with scheduledAt
    return await this.sendNotificationUseCase.execute({
      ...command,
      metadata: {
        ...command.metadata,
        scheduledAt: command.scheduledAt
      }
    });
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string): Promise<any> {
    const result = await this.getNotificationUseCase.execute({ notificationId });
    return result.notification;
  }

  /**
   * Get notifications by recipient
   */
  async getNotificationsByRecipient(recipientId: string, options: any = {}): Promise<any> {
    return await this.getNotificationsByRecipientUseCase.execute({
      recipientId,
      ...options
    });
  }

  /**
   * Search notifications
   */
  async searchNotifications(criteria: SearchNotificationsCommand): Promise<any> {
    return await this.searchNotificationsUseCase.execute(criteria);
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string, reason?: string, userId?: string): Promise<any> {
    return await this.cancelNotificationUseCase.execute({
      notificationId,
      reason,
      userId
    });
  }

  /**
   * Retry failed notification
   */
  async retryNotification(notificationId: string, channels?: string[], userId?: string): Promise<any> {
    return await this.retryNotificationUseCase.execute({
      notificationId,
      channels,
      userId
    });
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(command: SendBulkNotificationsCommand): Promise<any> {
    return await this.sendBulkNotificationsUseCase.execute(command);
  }

  /**
   * Process notification queue
   */
  async processQueue(command: ProcessQueueCommand): Promise<any> {
    return await this.processNotificationQueueUseCase.execute(command);
  }

  // ==================== Analytics & Reporting ====================

  /**
   * Get notification analytics
   */
  async getNotificationAnalytics(dateRange: { start: Date; end: Date }, options: any = {}): Promise<any> {
    return await this.getNotificationAnalyticsUseCase.execute({
      dateRange,
      ...options
    });
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<any> {
    return await this.getDashboardSummaryUseCase.execute();
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<any> {
    return await this.getHealthStatusUseCase.execute();
  }

  // ==================== Preferences Management ====================

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<any> {
    return await this.getNotificationPreferencesUseCase.execute({ userId });
  }

  /**
   * Update user preferences
   */
  async updatePreferences(command: UpdatePreferencesCommand): Promise<any> {
    return await this.updateNotificationPreferencesUseCase.execute(command);
  }
}
