/**
 * INotificationRepository - Domain Repository Interface
 * Repository interface for notification persistence operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */

import { Notification } from "../aggregates/Notification";
import { NotificationId } from "../value-objects/NotificationId";

export type NotificationStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PROCESSING"
  | "SENT"
  | "PARTIALLY_SENT"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface NotificationSearchCriteria {
  notificationId?: string;
  recipientId?: string;
  recipientType?: string;
  templateType?: string;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  channels?: string[];
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  isRead?: boolean;
  healthcareContext?: {
    patientId?: string;
    doctorId?: string;
    appointmentId?: string;
    medicalRecordId?: string;
  };
  tags?: string[];
  isUrgent?: boolean;
  hasFailures?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "scheduledAt" | "priority" | "status";
  sortOrder?: "ASC" | "DESC";
}

export interface NotificationStatistics {
  totalNotifications: number;
  byStatus: Record<NotificationStatus, number>;
  byPriority: Record<NotificationPriority, number>;
  byChannel: Record<string, number>;
  byTemplateType: Record<string, number>;
  successRate: number;
  averageDeliveryTime: number;
  failureReasons: Record<string, number>;
  recentActivity: {
    last24Hours: number;
    lastWeek: number;
    lastMonth: number;
  };
}

export interface DeliveryMetrics {
  notificationId: string;
  recipientId: string;
  templateType: string;
  channels: string[];
  scheduledAt: Date;
  sentAt?: Date;
  deliveryTime?: number;
  status: NotificationStatus;
  successfulChannels: string[];
  failedChannels: string[];
  retryAttempts: number;
  cost?: number;
}

export interface INotificationRepository {
  /**
   * Save notification aggregate
   */
  save(notification: Notification): Promise<void>;

  /**
   * Update existing notification
   */
  update(notification: Notification): Promise<void>;

  /**
   * Find notification by ID
   */
  findById(id: NotificationId): Promise<Notification | null>;

  /**
   * Find notifications by recipient
   */
  findByRecipient(
    recipientId: string,
    limit?: number,
    offset?: number,
  ): Promise<Notification[]>;

  /**
   * Find notifications by multiple criteria
   */
  findByCriteria(criteria: NotificationSearchCriteria): Promise<Notification[]>;

  /**
   * Find scheduled notifications ready for processing
   */
  findScheduledForProcessing(
    beforeTime?: Date,
    limit?: number,
  ): Promise<Notification[]>;

  /**
   * Find failed notifications eligible for retry
   */
  findFailedForRetry(
    beforeTime?: Date,
    maxAttempts?: number,
    limit?: number,
  ): Promise<Notification[]>;

  /**
   * Find notifications by status
   */
  findByStatus(
    status: NotificationStatus,
    limit?: number,
    offset?: number,
  ): Promise<Notification[]>;

  /**
   * Find urgent notifications
   */
  findUrgentNotifications(limit?: number): Promise<Notification[]>;

  /**
   * Find notifications by healthcare context
   */
  findByHealthcareContext(
    context: {
      patientId?: string;
      doctorId?: string;
      appointmentId?: string;
      medicalRecordId?: string;
    },
    limit?: number,
  ): Promise<Notification[]>;

  /**
   * Find notifications by template type
   */
  findByTemplateType(
    templateType: string,
    limit?: number,
    offset?: number,
  ): Promise<Notification[]>;

  /**
   * Find notifications by channel
   */
  findByChannel(
    channel: string,
    limit?: number,
    offset?: number,
  ): Promise<Notification[]>;

  /**
   * Find notifications by date range
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    limit?: number,
    offset?: number,
  ): Promise<Notification[]>;

  /**
   * Find duplicate notifications (same recipient, template, content hash)
   */
  findDuplicates(
    recipientId: string,
    templateType: string,
    contentHash: string,
    withinHours?: number,
  ): Promise<Notification[]>;

  /**
   * Count notifications by criteria
   */
  countByCriteria(criteria: NotificationSearchCriteria): Promise<number>;

  /**
   * Count notifications by status
   */
  countByStatus(status: NotificationStatus): Promise<number>;

  /**
   * Count notifications by recipient
   */
  countByRecipient(recipientId: string): Promise<number>;

  /**
   * Delete notification by ID
   */
  delete(id: NotificationId): Promise<void>;

  /**
   * Delete old notifications (cleanup)
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Delete notifications by criteria
   */
  deleteByCriteria(criteria: NotificationSearchCriteria): Promise<number>;

  /**
   * Check if notification exists
   */
  exists(id: NotificationId): Promise<boolean>;

  /**
   * Get notification statistics
   */
  getStatistics(dateRange?: {
    start: Date;
    end: Date;
  }): Promise<NotificationStatistics>;

  /**
   * Get delivery metrics
   */
  getDeliveryMetrics(
    criteria?: NotificationSearchCriteria,
  ): Promise<DeliveryMetrics[]>;

  /**
   * Get notifications requiring immediate attention (failed urgent notifications)
   */
  getNotificationsRequiringAttention(): Promise<Notification[]>;

  /**
   * Get notification history for recipient
   */
  getRecipientHistory(
    recipientId: string,
    limit?: number,
    offset?: number,
  ): Promise<Notification[]>;

  /**
   * Get recent notifications for dashboard
   */
  getRecentNotifications(limit?: number): Promise<Notification[]>;

  /**
   * Get notifications by correlation ID (for tracing)
   */
  findByCorrelationId(correlationId: string): Promise<Notification[]>;

  /**
   * Get overdue notifications (scheduled but not processed)
   */
  findOverdueNotifications(overdueThreshold?: number): Promise<Notification[]>;

  /**
   * Get notifications with high retry count
   */
  findHighRetryNotifications(minRetryCount?: number): Promise<Notification[]>;

  /**
   * Get notifications by priority and status
   */
  findByPriorityAndStatus(
    priority: NotificationPriority,
    status: NotificationStatus,
    limit?: number,
  ): Promise<Notification[]>;

  /**
   * Update notification status
   */
  updateStatus(id: NotificationId, status: NotificationStatus): Promise<void>;

  /**
   * Update notification retry information
   */
  updateRetryInfo(
    id: NotificationId,
    retryCount: number,
    nextRetryAt?: Date,
  ): Promise<void>;

  /**
   * Mark notification as processed
   */
  markAsProcessed(
    id: NotificationId,
    processedAt: Date,
    deliveryResults: any[],
  ): Promise<void>;

  /**
   * Mark notification as failed
   */
  markAsFailed(
    id: NotificationId,
    failureReason: string,
    failedAt: Date,
  ): Promise<void>;

  /**
   * Mark notification as read/unread
   */
  markAsRead(id: NotificationId, readAt: Date | null): Promise<void>;

  /**
   * Bulk update notifications
   */
  bulkUpdate(
    ids: NotificationId[],
    updates: Partial<{
      status: NotificationStatus;
      retryCount: number;
      nextRetryAt: Date;
      processedAt: Date;
    }>,
  ): Promise<void>;

  /**
   * Get notification queue size by priority
   */
  getQueueSize(priority?: NotificationPriority): Promise<number>;

  /**
   * Get average processing time
   */
  getAverageProcessingTime(
    templateType?: string,
    channel?: string,
  ): Promise<number>;

  /**
   * Get failure rate by channel
   */
  getFailureRateByChannel(dateRange?: {
    start: Date;
    end: Date;
  }): Promise<Record<string, number>>;

  /**
   * Get success rate by template type
   */
  getSuccessRateByTemplateType(dateRange?: {
    start: Date;
    end: Date;
  }): Promise<Record<string, number>>;

  /**
   * Get peak usage hours
   */
  getPeakUsageHours(): Promise<Record<number, number>>;

  /**
   * Get notification trends
   */
  getNotificationTrends(days: number): Promise<
    Array<{
      date: Date;
      total: number;
      successful: number;
      failed: number;
    }>
  >;

  /**
   * Archive old notifications
   */
  archiveOldNotifications(olderThanDays: number): Promise<number>;

  /**
   * Get health check information
   */
  getHealthCheck(): Promise<{
    isHealthy: boolean;
    pendingNotifications: number;
    failedNotifications: number;
    overdueNotifications: number;
    lastProcessedAt?: Date;
    averageResponseTime: number;
  }>;

  /**
   * Optimize database (cleanup, reindex, etc.)
   */
  optimize(): Promise<void>;

  /**
   * Get repository statistics
   */
  getRepositoryStats(): Promise<{
    totalRecords: number;
    indexHealth: Record<string, any>;
    queryPerformance: Record<string, number>;
    storageSize: number;
  }>;
}
