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
import { 
  INotificationRepository, 
  NotificationSearchCriteria, 
  NotificationStatistics, 
  DeliveryMetrics, 
  NotificationStatus, 
  NotificationPriority 
} from '../../domain/repositories/INotificationRepository';
import { Notification } from '../../domain/aggregates/Notification';
import { NotificationId } from '../../domain/value-objects/NotificationId';
import { RecipientInfo } from '../../domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../domain/value-objects/NotificationContent';
import { NotificationChannel } from '../../domain/value-objects/NotificationChannel';
import { IEventBus } from '../../../../shared/infrastructure/event-bus/EventBus';

/**
 * Supabase Notification Repository
 * Implements full INotificationRepository interface
 */
export class SupabaseNotificationRepository implements INotificationRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus?: IEventBus
  ) {}

  // ==================== Core CRUD Operations ====================

  /**
   * Save notification aggregate
   */
  public async save(notification: Notification): Promise<void> {
    try {
      const record = this.mapToRecord(notification);

      const { error } = await this.supabase
        .from('notifications')
        .insert(record);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // Publish domain events after successful save
      await this.publishDomainEvents(notification);
    } catch (error) {
      throw new Error(`Failed to save notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update existing notification
   */
  public async update(notification: Notification): Promise<void> {
    try {
      const record = this.mapToRecord(notification);
      const { id, notification_id, created_at, created_by, ...updateData } = record;

      const { error } = await this.supabase
        .from('notifications')
        .update(updateData)
        .eq('notification_id', notification_id);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // Publish domain events after successful update
      await this.publishDomainEvents(notification);
    } catch (error) {
      throw new Error(`Failed to update notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Publish domain events from aggregate
   */
  private async publishDomainEvents(notification: Notification): Promise<void> {
    if (!this.eventBus) {
      return; // EventBus not configured, skip publishing
    }

    const events = notification.getUncommittedEvents();
    for (const event of events) {
      try {
        await this.eventBus.publish(event);
      } catch (error) {
        console.error(`Failed to publish event ${event.eventType}:`, error);
        // Don't throw - event publishing failure shouldn't fail the save operation
      }
    }
    notification.markEventsAsCommitted();
  }

  /**
   * Find notification by ID
   */
  public async findById(id: NotificationId): Promise<Notification | null> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('notification_id', id.value)
        .eq('is_deleted', false)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data ? this.mapToAggregate(data) : null;
    } catch (error) {
      throw new Error(`Failed to find notification by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==================== Query Methods ====================

  /**
   * Find notifications by recipient
   */
  public async findByRecipient(recipientId: string, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', recipientId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw new Error(`Supabase error: ${error.message}`);

      return (data || []).map(record => this.mapToAggregate(record));
    } catch (error) {
      throw new Error(`Failed to find notifications by recipient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find notifications by multiple criteria
   */
  public async findByCriteria(criteria: NotificationSearchCriteria): Promise<Notification[]> {
    try {
      let query = this.supabase.from('notifications').select('*').eq('is_deleted', false);

      // Apply filters
      if (criteria.recipientId) query = query.eq('recipient_id', criteria.recipientId);
      if (criteria.recipientType) query = query.eq('recipient_type', criteria.recipientType);
      if (criteria.templateType) query = query.eq('template_type', criteria.templateType);
      if (criteria.status) query = query.eq('status', criteria.status);
      if (criteria.priority) query = query.eq('priority', criteria.priority);
      if (criteria.scheduledAfter) query = query.gte('scheduled_at', criteria.scheduledAfter.toISOString());
      if (criteria.scheduledBefore) query = query.lte('scheduled_at', criteria.scheduledBefore.toISOString());
      if (criteria.createdAfter) query = query.gte('created_at', criteria.createdAfter.toISOString());
      if (criteria.createdBefore) query = query.lte('created_at', criteria.createdBefore.toISOString());
      
      // Read status filter
      if (criteria.isRead !== undefined) {
        if (criteria.isRead) {
          query = query.not('read_at', 'is', null);
        } else {
          query = query.is('read_at', null);
        }
      }

      // Healthcare context filters
      if (criteria.healthcareContext?.patientId) {
        query = query.contains('healthcare_context', { patientId: criteria.healthcareContext.patientId });
      }
      if (criteria.healthcareContext?.appointmentId) {
        query = query.contains('healthcare_context', { appointmentId: criteria.healthcareContext.appointmentId });
      }

      // Sorting
      const sortBy = this.mapSortColumn(criteria.sortBy || 'createdAt');
      query = query.order(sortBy, { ascending: criteria.sortOrder === 'ASC' });

      // Pagination
      if (criteria.limit) {
        const offset = criteria.offset || 0;
        query = query.range(offset, offset + criteria.limit - 1);
      }

      const { data, error } = await query;
      if (error) throw new Error(`Supabase error: ${error.message}`);

      return (data || []).map(record => this.mapToAggregate(record));
    } catch (error) {
      throw new Error(`Failed to find notifications by criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find scheduled notifications ready for processing (using database function)
   */
  public async findScheduledForProcessing(_beforeTime?: Date, limit: number = 100): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_scheduled_notifications_due', { p_limit: limit });

      if (error) throw new Error(`Supabase error: ${error.message}`);

      // Map RPC results to full notifications
      const notificationIds = (data || []).map((row: any) => row.notification_id);
      if (notificationIds.length === 0) return [];

      return await this.findByNotificationIds(notificationIds);
    } catch (error) {
      throw new Error(`Failed to find scheduled notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find failed notifications eligible for retry (using database function)
   */
  public async findFailedForRetry(_beforeTime?: Date, _maxAttempts: number = 3, limit: number = 100): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_notifications_for_retry', { p_limit: limit });

      if (error) throw new Error(`Supabase error: ${error.message}`);

      const notificationIds = (data || []).map((row: any) => row.notification_id);
      if (notificationIds.length === 0) return [];

      return await this.findByNotificationIds(notificationIds);
    } catch (error) {
      throw new Error(`Failed to find failed notifications for retry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper: Find notifications by IDs
   */
  private async findByNotificationIds(ids: string[]): Promise<Notification[]> {
    const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
      .in('notification_id', ids)
      .eq('is_deleted', false);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return (data || []).map(record => this.mapToAggregate(record));
  }

  /**
   * Find notifications by status
   */
  public async findByStatus(status: NotificationStatus, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('status', status)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return (data || []).map(record => this.mapToAggregate(record));
  }

  /**
   * Find urgent notifications
   */
  public async findUrgentNotifications(limit: number = 100): Promise<Notification[]> {
    const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('priority', 'URGENT')
      .in('status', ['PENDING', 'SCHEDULED', 'PROCESSING', 'FAILED'])
      .eq('is_deleted', false)
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return (data || []).map(record => this.mapToAggregate(record));
  }

  /**
   * Find notifications by healthcare context
   */
  public async findByHealthcareContext(
    context: { patientId?: string; doctorId?: string; appointmentId?: string; medicalRecordId?: string },
    limit: number = 20
  ): Promise<Notification[]> {
    try {
      let query = this.supabase.from('notifications').select('*').eq('is_deleted', false);

      if (context.patientId) {
        query = query.contains('healthcare_context', { patientId: context.patientId });
      }
      if (context.doctorId) {
        query = query.contains('healthcare_context', { doctorId: context.doctorId });
      }
      if (context.appointmentId) {
        query = query.contains('healthcare_context', { appointmentId: context.appointmentId });
      }
      if (context.medicalRecordId) {
        query = query.contains('healthcare_context', { medicalRecordId: context.medicalRecordId });
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

      if (error) throw new Error(`Supabase error: ${error.message}`);

      return (data || []).map(record => this.mapToAggregate(record));
    } catch (error) {
      throw new Error(`Failed to find by healthcare context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async findByTemplateType(templateType: string, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('template_type', templateType)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(record => this.mapToAggregate(record));
  }

  public async findByChannel(channel: string, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .contains('successful_channels', [channel])
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(record => this.mapToAggregate(record));
  }

  public async findByDateRange(startDate: Date, endDate: Date, limit: number = 100, offset: number = 0): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(record => this.mapToAggregate(record));
  }

  public async findDuplicates(recipientId: string, templateType: string, _contentHash: string, withinHours: number = 24): Promise<Notification[]> {
    const cutoffTime = new Date(Date.now() - withinHours * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', recipientId)
      .eq('template_type', templateType)
      .gte('created_at', cutoffTime.toISOString())
      .eq('is_deleted', false);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(record => this.mapToAggregate(record));
  }

  // ==================== Count Methods ====================

  public async countByCriteria(criteria: NotificationSearchCriteria): Promise<number> {
    let query = this.supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_deleted', false);

    if (criteria.recipientId) query = query.eq('recipient_id', criteria.recipientId);
    if (criteria.status) query = query.eq('status', criteria.status);
    if (criteria.priority) query = query.eq('priority', criteria.priority);

    const { count, error } = await query;
    if (error) throw new Error(`Supabase error: ${error.message}`);

    return count || 0;
  }

  public async countByStatus(status: NotificationStatus): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
      .eq('is_deleted', false);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return count || 0;
  }

  public async countByRecipient(recipientId: string): Promise<number> {
    const { count, error } = await this.supabase
        .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', recipientId)
      .eq('is_deleted', false);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return count || 0;
  }

  // ==================== Delete Methods ====================

  public async delete(id: NotificationId): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: 'system' })
      .eq('notification_id', id.value);

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  public async deleteOlderThan(date: Date): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('cleanup_old_notifications', { p_days_old: Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)) });

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return data || 0;
  }

  public async deleteByCriteria(criteria: NotificationSearchCriteria): Promise<number> {
    let query = this.supabase.from('notifications').update({ is_deleted: true, deleted_at: new Date().toISOString() });

    if (criteria.status) query = query.eq('status', criteria.status);
    if (criteria.recipientId) query = query.eq('recipient_id', criteria.recipientId);

    const { data, error } = await query.select('notification_id');
    if (error) throw new Error(`Supabase error: ${error.message}`);

    return (data || []).length;
  }

  public async exists(id: NotificationId): Promise<boolean> {
    const { data, error } = await this.supabase
        .from('notifications')
      .select('notification_id')
      .eq('notification_id', id.value)
      .eq('is_deleted', false)
      .single();

    if (error && error.code === 'PGRST116') return false;
    if (error) throw new Error(`Supabase error: ${error.message}`);

    return !!data;
  }

  // ==================== Statistics & Metrics ====================

  public async getStatistics(dateRange?: { start: Date; end: Date }): Promise<NotificationStatistics> {
    try {
      let query = this.supabase.from('notifications').select('*').eq('is_deleted', false);

      if (dateRange) {
        query = query.gte('created_at', dateRange.start.toISOString())
                     .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw new Error(`Supabase error: ${error.message}`);

      const notifications = data || [];

      return {
        totalNotifications: notifications.length,
        byStatus: this.groupByStatus(notifications),
        byPriority: this.groupByPriority(notifications),
        byChannel: this.groupByChannel(notifications),
        byTemplateType: this.groupByTemplateType(notifications),
        successRate: this.calculateSuccessRate(notifications),
        averageDeliveryTime: this.calculateAvgDeliveryTime(notifications),
        failureReasons: {},
        recentActivity: {
          last24Hours: notifications.filter(n => new Date(n.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
          lastWeek: notifications.filter(n => new Date(n.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
          lastMonth: notifications.filter(n => new Date(n.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
        }
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getDeliveryMetrics(criteria?: NotificationSearchCriteria): Promise<DeliveryMetrics[]> {
    const notifications = criteria ? await this.findByCriteria(criteria) : await this.findByCriteria({ limit: 100 });

    return notifications.map(n => ({
      notificationId: n.id,
      recipientId: n.recipient.getRecipientId(),
      templateType: n.templateType,
      channels: n.channels.map(c => c.getType()),
      scheduledAt: n.createdAt,
      sentAt: n.sentAt,
      deliveryTime: n.sentAt ? n.sentAt.getTime() - n.createdAt.getTime() : undefined,
      status: n.status as NotificationStatus,
      successfulChannels: [],
      failedChannels: [],
      retryAttempts: 0,
      cost: 0
    }));
  }

  public async getNotificationsRequiringAttention(): Promise<Notification[]> {
    const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
      .eq('priority', 'URGENT')
      .eq('status', 'FAILED')
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(record => this.mapToAggregate(record));
  }

  public async getRecipientHistory(recipientId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    return this.findByRecipient(recipientId, limit, offset);
  }

  public async getRecentNotifications(limit: number = 20): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(record => this.mapToAggregate(record));
  }

  public async findByCorrelationId(correlationId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .contains('metadata', { correlationId })
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(record => this.mapToAggregate(record));
  }

  public async findOverdueNotifications(overdueThreshold: number = 60): Promise<Notification[]> {
    const cutoffTime = new Date(Date.now() - overdueThreshold * 60 * 1000);

    const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
      .eq('status', 'SCHEDULED')
      .lte('scheduled_at', cutoffTime.toISOString())
      .eq('is_deleted', false)
      .order('scheduled_at', { ascending: true });

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(record => this.mapToAggregate(record));
  }

  public async findHighRetryNotifications(minRetryCount: number = 3): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .gte('retry_count', minRetryCount)
      .eq('is_deleted', false)
      .order('retry_count', { ascending: false })
      .limit(50);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(record => this.mapToAggregate(record));
  }

  public async findByPriorityAndStatus(priority: NotificationPriority, status: NotificationStatus, limit: number = 20): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('priority', priority)
      .eq('status', status)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(record => this.mapToAggregate(record));
  }

  // ==================== Update Methods ====================

  public async updateStatus(id: NotificationId, status: NotificationStatus): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('notification_id', id.value);

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  public async updateRetryInfo(id: NotificationId, retryCount: number, nextRetryAt?: Date): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({
        retry_count: retryCount,
        next_retry_at: nextRetryAt?.toISOString(),
        last_retry_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('notification_id', id.value);

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  public async markAsProcessed(id: NotificationId, _processedAt: Date, deliveryResults: any[]): Promise<void> {
    const { error } = await this.supabase
      .rpc('mark_notification_as_sent', {
        p_notification_id: id.value,
        p_delivery_results: deliveryResults
      });

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  public async markAsFailed(id: NotificationId, failureReason: string, _failedAt: Date): Promise<void> {
    const deliveryResults = [{ channel: 'ALL', success: false, failureReason }];
    
    const { error } = await this.supabase
      .rpc('mark_notification_as_failed', {
        p_notification_id: id.value,
        p_delivery_results: deliveryResults,
        p_should_retry: true
      });

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  public async markAsRead(id: NotificationId, readAt: Date | null): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({
        read_at: readAt?.toISOString() || null,
        updated_at: new Date().toISOString()
      })
      .eq('notification_id', id.value);

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  public async bulkUpdate(ids: NotificationId[], updates: Partial<{ status: NotificationStatus; retryCount: number; nextRetryAt: Date; processedAt: Date }>): Promise<void> {
    const notificationIds = ids.map(id => id.value);
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.status) updateData.status = updates.status;
    if (updates.retryCount !== undefined) updateData.retry_count = updates.retryCount;
    if (updates.nextRetryAt) updateData.next_retry_at = updates.nextRetryAt.toISOString();

    const { error } = await this.supabase
      .from('notifications')
      .update(updateData)
      .in('notification_id', notificationIds);

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  // ==================== Analytics & Health ====================

  public async getQueueSize(priority?: NotificationPriority): Promise<number> {
    let query = this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .in('status', ['SCHEDULED', 'PROCESSING'])
      .eq('is_deleted', false);

    if (priority) query = query.eq('priority', priority);

    const { count, error } = await query;
    if (error) throw new Error(`Supabase error: ${error.message}`);

    return count || 0;
  }

  public async getAverageProcessingTime(_templateType?: string, channel?: string): Promise<number> {
    // Calculate from delivery_results table
    let query = this.supabase.from('notification_delivery_results').select('delivery_time_ms');

    if (channel) query = query.eq('channel', channel);

    const { data, error } = await query;
    if (error) throw new Error(`Supabase error: ${error.message}`);

    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, row) => acc + (row.delivery_time_ms || 0), 0);
    return Math.round(sum / data.length);
  }

  public async getFailureRateByChannel(dateRange?: { start: Date; end: Date }): Promise<Record<string, number>> {
    const { data, error } = await this.supabase
      .rpc('get_delivery_stats_by_channel', {
        p_start_date: dateRange?.start.toISOString(),
        p_end_date: dateRange?.end.toISOString()
      });

    if (error) throw new Error(`Supabase error: ${error.message}`);

    const result: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      result[row.channel] = 100 - (row.delivery_rate || 0);
    });

    return result;
  }

  public async getSuccessRateByTemplateType(dateRange?: { start: Date; end: Date }): Promise<Record<string, number>> {
    let query = this.supabase.from('notifications').select('template_type, status').eq('is_deleted', false);

    if (dateRange) {
      query = query.gte('created_at', dateRange.start.toISOString())
                   .lte('created_at', dateRange.end.toISOString());
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase error: ${error.message}`);

    const grouped = (data || []).reduce((acc: any, row: any) => {
      if (!acc[row.template_type]) {
        acc[row.template_type] = { total: 0, success: 0 };
      }
      acc[row.template_type].total++;
      if (row.status === 'SENT' || row.status === 'DELIVERED') {
        acc[row.template_type].success++;
      }
      return acc;
    }, {});

    const result: Record<string, number> = {};
    Object.keys(grouped).forEach(key => {
      result[key] = (grouped[key].success / grouped[key].total) * 100;
    });

    return result;
  }

  public async getPeakUsageHours(): Promise<Record<number, number>> {
    const { data, error } = await this.supabase
        .from('notifications')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('is_deleted', false);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    const hourCounts: Record<number, number> = {};
    (data || []).forEach(row => {
      const hour = new Date(row.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return hourCounts;
  }

  public async getNotificationTrends(days: number): Promise<Array<{ date: Date; total: number; successful: number; failed: number }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('notifications')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString())
      .eq('is_deleted', false);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    const grouped = (data || []).reduce((acc: any, row: any) => {
      const date = new Date(row.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date: new Date(date), total: 0, successful: 0, failed: 0 };
      }
      acc[date].total++;
      if (row.status === 'SENT' || row.status === 'DELIVERED') acc[date].successful++;
      if (row.status === 'FAILED') acc[date].failed++;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  public async archiveOldNotifications(olderThanDays: number): Promise<number> {
    return this.deleteOlderThan(new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000));
  }

  public async getHealthCheck(): Promise<{ isHealthy: boolean; pendingNotifications: number; failedNotifications: number; overdueNotifications: number; lastProcessedAt?: Date; averageResponseTime: number }> {
    const scheduled = await this.countByStatus('SCHEDULED');
    const processing = await this.countByStatus('PROCESSING');
    const pending = scheduled + processing;
    const failed = await this.countByStatus('FAILED');
    const overdue = (await this.findOverdueNotifications(60)).length;
    const avgTime = await this.getAverageProcessingTime();

    return {
      isHealthy: failed < 100 && overdue < 50,
      pendingNotifications: pending,
      failedNotifications: failed,
      overdueNotifications: overdue,
      averageResponseTime: avgTime
    };
  }

  public async optimize(): Promise<void> {
    // Run ANALYZE on tables
    await this.supabase.rpc('run_daily_maintenance');
  }

  public async getRepositoryStats(): Promise<{ totalRecords: number; indexHealth: Record<string, any>; queryPerformance: Record<string, number>; storageSize: number }> {
    const { count } = await this.supabase.from('notifications').select('*', { count: 'exact', head: true });

    return {
      totalRecords: count || 0,
      indexHealth: {},
      queryPerformance: {},
      storageSize: 0
    };
  }

  // ==================== Helper Methods ====================

  private mapSortColumn(sortBy: string): string {
    const columnMap: Record<string, string> = {
      'createdAt': 'created_at',
      'scheduledAt': 'scheduled_at',
      'priority': 'priority',
      'status': 'status'
    };
    return columnMap[sortBy] || 'created_at';
  }

  private mapToRecord(notification: Notification): any {
    const contactInfo = notification.recipient.getContactInfo();
    
    return {
      notification_id: notification.id,
      recipient_id: notification.recipient.getRecipientId(),
      recipient_type: notification.recipient.getRecipientType(),
      recipient_name: notification.recipient.getFullName(),
      recipient_email: contactInfo.email,
      recipient_phone: contactInfo.phoneNumber,
      template_type: notification.templateType,
      subject: notification.content.getSubject() || 'No Subject',
      body: notification.content.getBody(),
      html_body: null, // Not supported in current NotificationContent
      channels: notification.channels.map(c => c.getType()),
      status: notification.status,
      priority: notification.priority,
      sent_at: notification.sentAt?.toISOString(),
      delivered_at: notification.deliveredAt?.toISOString(),
      read_at: notification.readAt?.toISOString(),
      delivery_results: notification.deliveryResults,
      successful_channels: notification.deliveryResults?.filter((r: any) => r.success).map((r: any) => r.channel) || [],
      failed_channels: notification.deliveryResults?.filter((r: any) => !r.success).map((r: any) => r.channel) || [],
      healthcare_context: notification.metadata.healthcareContext || {},
      metadata: notification.metadata,
      created_at: notification.createdAt.toISOString(),
      updated_at: notification.updatedAt.toISOString()
    };
  }

  private mapToAggregate(record: any): Notification {
    const recipient = RecipientInfo.create({
      recipientId: record.recipient_id,
      recipientType: record.recipient_type,
      fullName: record.recipient_name || 'Unknown',
      contactInfo: {
        email: record.recipient_email,
        phoneNumber: record.recipient_phone
      },
      preferences: {
        preferredChannels: ['EMAIL'],
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'vi',
        optOut: { marketing: false, reminders: false, emergency: false }
      }
    });

    const content = NotificationContent.create({
      subject: record.subject,
      body: record.body,
      footer: undefined,
      contentType: 'TEXT',
      language: 'vi'
    });

    const channels = Array.isArray(record.channels) 
      ? record.channels.map((ch: string) => NotificationChannel.create(ch))
      : [];

    const notification = Notification.create({
      recipient,
      templateType: record.template_type,
      content,
      channels,
      priority: record.priority,
      metadata: {
        source: record.metadata?.source || 'unknown',
        correlationId: record.metadata?.correlationId,
        userId: record.metadata?.userId,
        sessionId: record.metadata?.sessionId,
        healthcareContext: record.healthcare_context
      }
    });

    // Set additional fields from database
    if (record.sent_at) {
      (notification as any).props.sentAt = new Date(record.sent_at);
    }
    if (record.delivered_at) {
      (notification as any).props.deliveredAt = new Date(record.delivered_at);
    }
    if (record.read_at) {
      (notification as any).props.readAt = new Date(record.read_at);
    }
    if (record.status) {
      (notification as any).props.status = record.status;
    }
    if (record.delivery_results) {
      (notification as any).props.deliveryResults = record.delivery_results;
    }
    if (record.created_at) {
      (notification as any).props.createdAt = new Date(record.created_at);
    }
    if (record.updated_at) {
      (notification as any).props.updatedAt = new Date(record.updated_at);
    }

    return notification;
  }

  private groupByStatus(notifications: any[]): Record<NotificationStatus, number> {
    const result: any = { DRAFT: 0, SCHEDULED: 0, PROCESSING: 0, SENT: 0, PARTIALLY_SENT: 0, FAILED: 0, CANCELLED: 0, EXPIRED: 0 };
    notifications.forEach(n => {
      result[n.status as NotificationStatus] = (result[n.status] || 0) + 1;
    });
    return result;
  }

  private groupByPriority(notifications: any[]): Record<NotificationPriority, number> {
    const result: any = { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 };
    notifications.forEach(n => {
      result[n.priority as NotificationPriority] = (result[n.priority] || 0) + 1;
    });
    return result;
  }

  private groupByChannel(notifications: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    notifications.forEach(n => {
      const channels = Array.isArray(n.successful_channels) ? n.successful_channels : [];
      channels.forEach((ch: string) => {
        result[ch] = (result[ch] || 0) + 1;
      });
    });
    return result;
  }

  private groupByTemplateType(notifications: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    notifications.forEach(n => {
      result[n.template_type] = (result[n.template_type] || 0) + 1;
    });
    return result;
  }

  private calculateSuccessRate(notifications: any[]): number {
    if (notifications.length === 0) return 0;
    const successful = notifications.filter(n => n.status === 'SENT' || n.status === 'DELIVERED').length;
    return (successful / notifications.length) * 100;
  }

  private calculateAvgDeliveryTime(notifications: any[]): number {
    const withDeliveryTime = notifications.filter(n => n.sent_at && n.created_at);
    if (withDeliveryTime.length === 0) return 0;

    const sum = withDeliveryTime.reduce((acc, n) => {
      const deliveryTime = new Date(n.sent_at).getTime() - new Date(n.created_at).getTime();
      return acc + deliveryTime;
    }, 0);

    return Math.round(sum / withDeliveryTime.length);
  }
}
