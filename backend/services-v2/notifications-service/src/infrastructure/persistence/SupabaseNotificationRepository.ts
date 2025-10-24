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
import { INotificationRepository, NotificationSearchCriteria, NotificationStatistics, DeliveryMetrics, NotificationStatus, NotificationPriority } from '../../domain/repositories/INotificationRepository';
import { Notification } from '../../domain/aggregates/Notification';
import { NotificationId } from '../../domain/value-objects/NotificationId';
import { RecipientInfo } from '../../domain/value-objects/RecipientInfo';
import { NotificationTemplate } from '../../domain/value-objects/NotificationTemplate';
import { NotificationContent } from '../../domain/value-objects/NotificationContent';
import { NotificationChannel } from '../../domain/value-objects/NotificationChannel';
import { ILogger } from '@shared/infrastructure/logging/logger.interface';
import { IAuditService } from '@shared/application/services/audit.service.interface';

interface NotificationRecord {
  notification_id: string;
  recipient_id: string;
  recipient_type: string;
  recipient_data: any;
  template_id: string;
  template_type: string;
  template_data: any;
  content_data: any;
  channels: string[];
  status: string;
  priority: string;
  scheduled_at: string;
  expires_at?: string;
  sent_at?: string;
  delivery_attempts: any[];
  retry_count: number;
  next_retry_at?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

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
export class SupabaseNotificationRepository implements INotificationRepository {
  private readonly supabaseClient: OptimizedSupabaseClient;
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly schema: string;
  private readonly tableName: string;

  constructor(config: SupabaseNotificationRepositoryConfig) {
    this.supabaseClient = config.supabase;
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.schema = config.schema || 'notifications_schema';
    this.tableName = config.tableName || 'notifications';
  }

  /**
   * Save notification aggregate
   */
  public async save(notification: Notification): Promise<void> {
    try {
      const record = this.mapToRecord(notification);

      const { error } = await this.supabaseClient.getRawClient()
        .from('notifications')
        .insert(record);

      if (error) {
        throw new Error(`Lỗi khi lưu thông báo: ${error.message}`);
      }

    } catch (error) {
      throw new Error(`Lỗi repository khi lưu thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Update existing notification
   */
  public async update(notification: Notification): Promise<void> {
    try {
      const record = this.mapToRecord(notification);
      const { notification_id, created_at, ...updateData } = record;

      const { error } = await this.supabaseClient.getRawClient()
        .from('notifications')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('notification_id', notification_id);

      if (error) {
        throw new Error(`Lỗi khi cập nhật thông báo: ${error.message}`);
      }

    } catch (error) {
      throw new Error(`Lỗi repository khi cập nhật thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Find notification by ID
   */
  public async findById(id: NotificationId): Promise<Notification | null> {
    try {
      const { data, error } = await this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*')
        .eq('notification_id', id.getValue())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Lỗi khi tìm thông báo: ${error.message}`);
      }

      return this.mapToAggregate(data);

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Find notifications by recipient
   */
  public async findByRecipient(recipientId: string, limit?: number, offset?: number): Promise<Notification[]> {
    try {
      let query = this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*')
        .eq('recipient_id', recipientId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi tìm thông báo theo người nhận: ${error.message}`);
      }

      return data?.map(record => this.mapToAggregate(record)) || [];

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm thông báo theo người nhận: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Find notifications by multiple criteria
   */
  public async findByCriteria(criteria: NotificationSearchCriteria): Promise<Notification[]> {
    try {
      let query = this.supabaseClient.getRawClient().from('notifications').select('*');

      // Apply filters
      if (criteria.recipientId) {
        query = query.eq('recipient_id', criteria.recipientId);
      }

      if (criteria.recipientType) {
        query = query.eq('recipient_type', criteria.recipientType);
      }

      if (criteria.templateType) {
        query = query.eq('template_type', criteria.templateType);
      }

      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }

      if (criteria.priority) {
        query = query.eq('priority', criteria.priority);
      }

      if (criteria.channels && criteria.channels.length > 0) {
        query = query.overlaps('channels', criteria.channels);
      }

      if (criteria.scheduledAfter) {
        query = query.gte('scheduled_at', criteria.scheduledAfter.toISOString());
      }

      if (criteria.scheduledBefore) {
        query = query.lte('scheduled_at', criteria.scheduledBefore.toISOString());
      }

      if (criteria.createdAfter) {
        query = query.gte('created_at', criteria.createdAfter.toISOString());
      }

      if (criteria.createdBefore) {
        query = query.lte('created_at', criteria.createdBefore.toISOString());
      }

      if (criteria.isUrgent !== undefined) {
        if (criteria.isUrgent) {
          query = query.eq('priority', 'URGENT');
        } else {
          query = query.neq('priority', 'URGENT');
        }
      }

      if (criteria.hasFailures !== undefined) {
        if (criteria.hasFailures) {
          query = query.in('status', ['FAILED', 'PARTIALLY_SENT']);
        } else {
          query = query.not('status', 'in', '(FAILED,PARTIALLY_SENT)');
        }
      }

      // Healthcare context filters
      if (criteria.healthcareContext) {
        if (criteria.healthcareContext.patientId) {
          query = query.eq('metadata->>healthcareContext->>patientId', criteria.healthcareContext.patientId);
        }
        if (criteria.healthcareContext.doctorId) {
          query = query.eq('metadata->>healthcareContext->>doctorId', criteria.healthcareContext.doctorId);
        }
        if (criteria.healthcareContext.appointmentId) {
          query = query.eq('metadata->>healthcareContext->>appointmentId', criteria.healthcareContext.appointmentId);
        }
        if (criteria.healthcareContext.medicalRecordId) {
          query = query.eq('metadata->>healthcareContext->>medicalRecordId', criteria.healthcareContext.medicalRecordId);
        }
      }

      // Tags filter
      if (criteria.tags && criteria.tags.length > 0) {
        query = query.overlaps('metadata->>tags', criteria.tags);
      }

      // Sorting
      const sortBy = criteria.sortBy || 'createdAt';
      const sortOrder = criteria.sortOrder || 'DESC';
      const sortColumn = this.mapSortColumn(sortBy);
      
      query = query.order(sortColumn, { ascending: sortOrder === 'ASC' });

      // Pagination
      if (criteria.limit) {
        query = query.limit(criteria.limit);
      }

      if (criteria.offset) {
        const limit = criteria.limit || 20;
        query = query.range(criteria.offset, criteria.offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi tìm kiếm thông báo: ${error.message}`);
      }

      return data?.map(record => this.mapToAggregate(record)) || [];

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm kiếm thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Find scheduled notifications ready for processing
   */
  public async findScheduledForProcessing(beforeTime?: Date, limit?: number): Promise<Notification[]> {
    try {
      const cutoffTime = beforeTime || new Date();

      let query = this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*')
        .eq('status', 'SCHEDULED')
        .lte('scheduled_at', cutoffTime.toISOString())
        .order('priority', { ascending: false }) // URGENT first
        .order('scheduled_at', { ascending: true }); // Oldest first

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi tìm thông báo đã lên lịch: ${error.message}`);
      }

      return data?.map(record => this.mapToAggregate(record)) || [];

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm thông báo đã lên lịch: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Find failed notifications eligible for retry
   */
  public async findFailedForRetry(beforeTime?: Date, maxAttempts?: number, limit?: number): Promise<Notification[]> {
    try {
      const cutoffTime = beforeTime || new Date();
      const maxRetries = maxAttempts || 5;

      let query = this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*')
        .eq('status', 'FAILED')
        .lt('retry_count', maxRetries)
        .or(`next_retry_at.is.null,next_retry_at.lte.${cutoffTime.toISOString()}`)
        .order('priority', { ascending: false })
        .order('next_retry_at', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi tìm thông báo thất bại để thử lại: ${error.message}`);
      }

      return data?.map(record => this.mapToAggregate(record)) || [];

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm thông báo thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Find notifications by status
   */
  public async findByStatus(status: NotificationStatus, limit?: number, offset?: number): Promise<Notification[]> {
    try {
      let query = this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi tìm thông báo theo trạng thái: ${error.message}`);
      }

      return data?.map(record => this.mapToAggregate(record)) || [];

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm thông báo theo trạng thái: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Find urgent notifications
   */
  public async findUrgentNotifications(limit?: number): Promise<Notification[]> {
    try {
      let query = this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*')
        .eq('priority', 'URGENT')
        .in('status', ['SCHEDULED', 'PROCESSING', 'FAILED'])
        .order('scheduled_at', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi tìm thông báo khẩn cấp: ${error.message}`);
      }

      return data?.map(record => this.mapToAggregate(record)) || [];

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm thông báo khẩn cấp: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Find notifications by healthcare context
   */
  public async findByHealthcareContext(context: {
    patientId?: string;
    doctorId?: string;
    appointmentId?: string;
    medicalRecordId?: string;
  }, limit?: number): Promise<Notification[]> {
    try {
      let query = this.supabaseClient.getRawClient().from('notifications').select('*');

      if (context.patientId) {
        query = query.eq('metadata->>healthcareContext->>patientId', context.patientId);
      }

      if (context.doctorId) {
        query = query.eq('metadata->>healthcareContext->>doctorId', context.doctorId);
      }

      if (context.appointmentId) {
        query = query.eq('metadata->>healthcareContext->>appointmentId', context.appointmentId);
      }

      if (context.medicalRecordId) {
        query = query.eq('metadata->>healthcareContext->>medicalRecordId', context.medicalRecordId);
      }

      query = query.order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi tìm thông báo theo bối cảnh y tế: ${error.message}`);
      }

      return data?.map(record => this.mapToAggregate(record)) || [];

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm thông báo theo bối cảnh y tế: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Map sort column names
   */
  private mapSortColumn(sortBy: string): string {
    const columnMap: Record<string, string> = {
      'createdAt': 'created_at',
      'scheduledAt': 'scheduled_at',
      'priority': 'priority',
      'status': 'status'
    };

    return columnMap[sortBy] || 'created_at';
  }

  /**
   * Map notification aggregate to database record
   */
  private mapToRecord(notification: Notification): NotificationRecord {
    return {
      notification_id: notification.getId().getValue(),
      recipient_id: notification.getRecipient().getRecipientId(),
      recipient_type: notification.getRecipient().getRecipientType(),
      recipient_data: notification.getRecipient().toJSON(),
      template_id: notification.getTemplate().getTemplateId(),
      template_type: notification.getTemplate().getTemplateType(),
      template_data: notification.getTemplate().toJSON(),
      content_data: notification.getContent().toJSON(),
      channels: notification.getChannels().map(c => c.getType()),
      status: notification.getStatus(),
      priority: notification.getPriority(),
      scheduled_at: notification.getScheduledAt().toISOString(),
      expires_at: notification.getExpiresAt()?.toISOString(),
      sent_at: notification.getSentAt()?.toISOString(),
      delivery_attempts: notification.getDeliveryAttempts(),
      retry_count: notification.getRetryCount(),
      next_retry_at: notification.getNextRetryAt()?.toISOString(),
      metadata: notification.getMetadata(),
      created_at: notification.getCreatedAt().toISOString(),
      updated_at: notification.getUpdatedAt().toISOString()
    };
  }

  /**
   * Map database record to notification aggregate
   */
  private mapToAggregate(record: NotificationRecord): Notification {
    // This is a simplified mapping - in a real implementation,
    // you would need to properly reconstruct all value objects
    // and the aggregate from the stored data
    
    const recipient = RecipientInfo.fromJSON(record.recipient_data);
    const template = NotificationTemplate.fromJSON ? NotificationTemplate.fromJSON(record.template_data) : {} as any;
    const content = NotificationContent.fromJSON(record.content_data);
    
    const channels = record.channels.map(channelType => {
      switch (channelType) {
        case 'EMAIL': return NotificationChannel.createEmail();
        case 'SMS': return NotificationChannel.createSMS();
        case 'PUSH': return NotificationChannel.createPush();
        case 'IN_APP': return NotificationChannel.createInApp();
        case 'VOICE': return NotificationChannel.createVoice();
        default: return NotificationChannel.createEmail();
      }
    });

    // Create aggregate using the create method
    const notification = Notification.create({
      recipient,
      template,
      content,
      channels,
      priority: record.priority as any,
      scheduledAt: new Date(record.scheduled_at),
      expiresAt: record.expires_at ? new Date(record.expires_at) : undefined,
      metadata: record.metadata
    });

    // Note: In a real implementation, you would need to restore the full state
    // including delivery attempts, retry count, etc. This would require
    // additional methods on the aggregate or a more sophisticated reconstruction process.

    return notification;
  }

  /**
   * Find notifications by template type
   */
  public async findByTemplateType(templateType: string, limit?: number, offset?: number): Promise<Notification[]> {
    try {
      let query = this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*')
        .eq('template_type', templateType)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi tìm thông báo theo template: ${error.message}`);
      }

      return data?.map(record => this.mapToAggregate(record)) || [];

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm thông báo theo template: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Find notifications by channel
   */
  public async findByChannel(channel: string, limit?: number, offset?: number): Promise<Notification[]> {
    try {
      let query = this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*')
        .contains('channels', [channel])
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi tìm thông báo theo kênh: ${error.message}`);
      }

      return data?.map(record => this.mapToAggregate(record)) || [];

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm thông báo theo kênh: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Find notifications by date range
   */
  public async findByDateRange(startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<Notification[]> {
    try {
      let query = this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi tìm thông báo theo khoảng thời gian: ${error.message}`);
      }

      return data?.map(record => this.mapToAggregate(record)) || [];

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm thông báo theo khoảng thời gian: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Find duplicate notifications
   */
  public async findDuplicates(recipientId: string, templateType: string, contentHash: string, withinHours?: number): Promise<Notification[]> {
    try {
      let query = this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*')
        .eq('recipient_id', recipientId)
        .eq('template_type', templateType)
        .eq('content_data->>contentHash', contentHash);

      if (withinHours) {
        const cutoffTime = new Date(Date.now() - withinHours * 60 * 60 * 1000);
        query = query.gte('created_at', cutoffTime.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi tìm thông báo trùng lặp: ${error.message}`);
      }

      return data?.map(record => this.mapToAggregate(record)) || [];

    } catch (error) {
      throw new Error(`Lỗi repository khi tìm thông báo trùng lặp: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Count notifications by criteria
   */
  public async countByCriteria(criteria: NotificationSearchCriteria): Promise<number> {
    try {
      let query = this.supabaseClient.getRawClient().from('notifications').select('*', { count: 'exact', head: true });

      // Apply same filters as findByCriteria
      if (criteria.recipientId) {
        query = query.eq('recipient_id', criteria.recipientId);
      }

      if (criteria.recipientType) {
        query = query.eq('recipient_type', criteria.recipientType);
      }

      if (criteria.templateType) {
        query = query.eq('template_type', criteria.templateType);
      }

      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }

      if (criteria.priority) {
        query = query.eq('priority', criteria.priority);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Lỗi khi đếm thông báo: ${error.message}`);
      }

      return count || 0;

    } catch (error) {
      throw new Error(`Lỗi repository khi đếm thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Count notifications by status
   */
  public async countByStatus(status: NotificationStatus): Promise<number> {
    try {
      const { count, error } = await this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (error) {
        throw new Error(`Lỗi khi đếm thông báo theo trạng thái: ${error.message}`);
      }

      return count || 0;

    } catch (error) {
      throw new Error(`Lỗi repository khi đếm thông báo theo trạng thái: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Count notifications by recipient
   */
  public async countByRecipient(recipientId: string): Promise<number> {
    try {
      const { count, error } = await this.supabaseClient.getRawClient()
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', recipientId);

      if (error) {
        throw new Error(`Lỗi khi đếm thông báo theo người nhận: ${error.message}`);
      }

      return count || 0;

    } catch (error) {
      throw new Error(`Lỗi repository khi đếm thông báo theo người nhận: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Delete notification by ID
   */
  public async delete(id: NotificationId): Promise<void> {
    try {
      const { error } = await this.supabaseClient.getRawClient()
        .from('notifications')
        .delete()
        .eq('notification_id', id.getValue());

      if (error) {
        throw new Error(`Lỗi khi xóa thông báo: ${error.message}`);
      }

    } catch (error) {
      throw new Error(`Lỗi repository khi xóa thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Delete old notifications
   */
  public async deleteOlderThan(date: Date): Promise<number> {
    try {
      const { data, error } = await this.supabaseClient.getRawClient()
        .from('notifications')
        .delete()
        .lt('created_at', date.toISOString())
        .select('notification_id');

      if (error) {
        throw new Error(`Lỗi khi xóa thông báo cũ: ${error.message}`);
      }

      return data?.length || 0;

    } catch (error) {
      throw new Error(`Lỗi repository khi xóa thông báo cũ: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Check if notification exists
   */
  public async exists(id: NotificationId): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient.getRawClient()
        .from('notifications')
        .select('notification_id')
        .eq('notification_id', id.getValue())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false; // Not found
        }
        throw new Error(`Lỗi khi kiểm tra tồn tại thông báo: ${error.message}`);
      }

      return !!data;

    } catch (error) {
      throw new Error(`Lỗi repository khi kiểm tra tồn tại thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }
}
