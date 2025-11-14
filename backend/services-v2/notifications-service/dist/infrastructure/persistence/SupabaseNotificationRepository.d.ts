/**
 * SupabaseNotificationRepository - Infrastructure Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Complete Supabase implementation matching new database schema
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, HIPAA
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { INotificationRepository, NotificationSearchCriteria, NotificationStatistics, DeliveryMetrics, NotificationStatus, NotificationPriority } from '../../domain/repositories/INotificationRepository';
import { Notification } from '../../domain/aggregates/Notification';
import { NotificationId } from '../../domain/value-objects/NotificationId';
/**
 * Supabase Notification Repository
 * Implements full INotificationRepository interface
 */
export declare class SupabaseNotificationRepository implements INotificationRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
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
    findByRecipient(recipientId: string, limit?: number, offset?: number): Promise<Notification[]>;
    /**
     * Find notifications by multiple criteria
     */
    findByCriteria(criteria: NotificationSearchCriteria): Promise<Notification[]>;
    /**
     * Find scheduled notifications ready for processing (using database function)
     */
    findScheduledForProcessing(_beforeTime?: Date, limit?: number): Promise<Notification[]>;
    /**
     * Find failed notifications eligible for retry (using database function)
     */
    findFailedForRetry(_beforeTime?: Date, _maxAttempts?: number, limit?: number): Promise<Notification[]>;
    /**
     * Helper: Find notifications by IDs
     */
    private findByNotificationIds;
    /**
     * Find notifications by status
     */
    findByStatus(status: NotificationStatus, limit?: number, offset?: number): Promise<Notification[]>;
    /**
     * Find urgent notifications
     */
    findUrgentNotifications(limit?: number): Promise<Notification[]>;
    /**
     * Find notifications by healthcare context
     */
    findByHealthcareContext(context: {
        patientId?: string;
        doctorId?: string;
        appointmentId?: string;
        medicalRecordId?: string;
    }, limit?: number): Promise<Notification[]>;
    findByTemplateType(templateType: string, limit?: number, offset?: number): Promise<Notification[]>;
    findByChannel(channel: string, limit?: number, offset?: number): Promise<Notification[]>;
    findByDateRange(startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<Notification[]>;
    findDuplicates(recipientId: string, templateType: string, _contentHash: string, withinHours?: number): Promise<Notification[]>;
    countByCriteria(criteria: NotificationSearchCriteria): Promise<number>;
    countByStatus(status: NotificationStatus): Promise<number>;
    countByRecipient(recipientId: string): Promise<number>;
    delete(id: NotificationId): Promise<void>;
    deleteOlderThan(date: Date): Promise<number>;
    deleteByCriteria(criteria: NotificationSearchCriteria): Promise<number>;
    exists(id: NotificationId): Promise<boolean>;
    getStatistics(dateRange?: {
        start: Date;
        end: Date;
    }): Promise<NotificationStatistics>;
    getDeliveryMetrics(criteria?: NotificationSearchCriteria): Promise<DeliveryMetrics[]>;
    getNotificationsRequiringAttention(): Promise<Notification[]>;
    getRecipientHistory(recipientId: string, limit?: number, offset?: number): Promise<Notification[]>;
    getRecentNotifications(limit?: number): Promise<Notification[]>;
    findByCorrelationId(correlationId: string): Promise<Notification[]>;
    findOverdueNotifications(overdueThreshold?: number): Promise<Notification[]>;
    findHighRetryNotifications(minRetryCount?: number): Promise<Notification[]>;
    findByPriorityAndStatus(priority: NotificationPriority, status: NotificationStatus, limit?: number): Promise<Notification[]>;
    updateStatus(id: NotificationId, status: NotificationStatus): Promise<void>;
    updateRetryInfo(id: NotificationId, retryCount: number, nextRetryAt?: Date): Promise<void>;
    markAsProcessed(id: NotificationId, _processedAt: Date, deliveryResults: any[]): Promise<void>;
    markAsFailed(id: NotificationId, failureReason: string, _failedAt: Date): Promise<void>;
    bulkUpdate(ids: NotificationId[], updates: Partial<{
        status: NotificationStatus;
        retryCount: number;
        nextRetryAt: Date;
        processedAt: Date;
    }>): Promise<void>;
    getQueueSize(priority?: NotificationPriority): Promise<number>;
    getAverageProcessingTime(_templateType?: string, channel?: string): Promise<number>;
    getFailureRateByChannel(dateRange?: {
        start: Date;
        end: Date;
    }): Promise<Record<string, number>>;
    getSuccessRateByTemplateType(dateRange?: {
        start: Date;
        end: Date;
    }): Promise<Record<string, number>>;
    getPeakUsageHours(): Promise<Record<number, number>>;
    getNotificationTrends(days: number): Promise<Array<{
        date: Date;
        total: number;
        successful: number;
        failed: number;
    }>>;
    archiveOldNotifications(olderThanDays: number): Promise<number>;
    getHealthCheck(): Promise<{
        isHealthy: boolean;
        pendingNotifications: number;
        failedNotifications: number;
        overdueNotifications: number;
        lastProcessedAt?: Date;
        averageResponseTime: number;
    }>;
    optimize(): Promise<void>;
    getRepositoryStats(): Promise<{
        totalRecords: number;
        indexHealth: Record<string, any>;
        queryPerformance: Record<string, number>;
        storageSize: number;
    }>;
    private mapSortColumn;
    private mapToRecord;
    private mapToAggregate;
    private groupByStatus;
    private groupByPriority;
    private groupByChannel;
    private groupByTemplateType;
    private calculateSuccessRate;
    private calculateAvgDeliveryTime;
}
//# sourceMappingURL=SupabaseNotificationRepository.d.ts.map