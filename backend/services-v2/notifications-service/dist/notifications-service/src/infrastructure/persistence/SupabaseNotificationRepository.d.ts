/**
 * SupabaseNotificationRepository - Infrastructure Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Supabase implementation of notification repository with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, Vietnamese Healthcare Standards, HIPAA
 */
import { OptimizedSupabaseClient } from '@shared/infrastructure/database/optimized-supabase-client';
import { INotificationRepository, NotificationSearchCriteria, NotificationStatus } from '../../domain/repositories/INotificationRepository';
import { Notification } from '../../domain/aggregates/Notification';
import { NotificationId } from '../../domain/value-objects/NotificationId';
import { ILogger } from '@shared/infrastructure/logging/logger.interface';
import { IAuditService } from '@shared/application/services/audit.service.interface';
export interface SupabaseNotificationRepositoryConfig {
    supabase: OptimizedSupabaseClient;
    logger: ILogger;
    auditService: IAuditService;
    schema: string;
    tableName: string;
}
/**
 * Supabase Notification Repository
 * Implements notification repository with Vietnamese healthcare compliance
 */
export declare class SupabaseNotificationRepository implements INotificationRepository {
    private readonly supabaseClient;
    private readonly logger;
    private readonly auditService;
    private readonly schema;
    private readonly tableName;
    constructor(config: SupabaseNotificationRepositoryConfig);
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
     * Find scheduled notifications ready for processing
     */
    findScheduledForProcessing(beforeTime?: Date, limit?: number): Promise<Notification[]>;
    /**
     * Find failed notifications eligible for retry
     */
    findFailedForRetry(beforeTime?: Date, maxAttempts?: number, limit?: number): Promise<Notification[]>;
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
    /**
     * Map sort column names
     */
    private mapSortColumn;
    /**
     * Map notification aggregate to database record
     */
    private mapToRecord;
    /**
     * Map database record to notification aggregate
     */
    private mapToAggregate;
    /**
     * Find notifications by template type
     */
    findByTemplateType(templateType: string, limit?: number, offset?: number): Promise<Notification[]>;
    /**
     * Find notifications by channel
     */
    findByChannel(channel: string, limit?: number, offset?: number): Promise<Notification[]>;
    /**
     * Find notifications by date range
     */
    findByDateRange(startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<Notification[]>;
    /**
     * Find duplicate notifications
     */
    findDuplicates(recipientId: string, templateType: string, contentHash: string, withinHours?: number): Promise<Notification[]>;
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
     * Delete old notifications
     */
    deleteOlderThan(date: Date): Promise<number>;
    /**
     * Check if notification exists
     */
    exists(id: NotificationId): Promise<boolean>;
}
//# sourceMappingURL=SupabaseNotificationRepository.d.ts.map