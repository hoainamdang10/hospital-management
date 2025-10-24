"use strict";
/**
 * SupabaseNotificationRepository - Infrastructure Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Supabase implementation of notification repository with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseNotificationRepository = void 0;
const Notification_1 = require("../../domain/aggregates/Notification");
const RecipientInfo_1 = require("../../domain/value-objects/RecipientInfo");
const NotificationTemplate_1 = require("../../domain/value-objects/NotificationTemplate");
const NotificationContent_1 = require("../../domain/value-objects/NotificationContent");
const NotificationChannel_1 = require("../../domain/value-objects/NotificationChannel");
/**
 * Supabase Notification Repository
 * Implements notification repository with Vietnamese healthcare compliance
 */
class SupabaseNotificationRepository {
    constructor(config) {
        this.supabaseClient = config.supabase;
        this.logger = config.logger;
        this.auditService = config.auditService;
        this.schema = config.schema || 'notifications_schema';
        this.tableName = config.tableName || 'notifications';
    }
    /**
     * Save notification aggregate
     */
    async save(notification) {
        try {
            const record = this.mapToRecord(notification);
            const { error } = await this.supabaseClient.getRawClient()
                .from('notifications')
                .insert(record);
            if (error) {
                throw new Error(`Lỗi khi lưu thông báo: ${error.message}`);
            }
        }
        catch (error) {
            throw new Error(`Lỗi repository khi lưu thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Update existing notification
     */
    async update(notification) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi cập nhật thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Find notification by ID
     */
    async findById(id) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Find notifications by recipient
     */
    async findByRecipient(recipientId, limit, offset) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm thông báo theo người nhận: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Find notifications by multiple criteria
     */
    async findByCriteria(criteria) {
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
                }
                else {
                    query = query.neq('priority', 'URGENT');
                }
            }
            if (criteria.hasFailures !== undefined) {
                if (criteria.hasFailures) {
                    query = query.in('status', ['FAILED', 'PARTIALLY_SENT']);
                }
                else {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm kiếm thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Find scheduled notifications ready for processing
     */
    async findScheduledForProcessing(beforeTime, limit) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm thông báo đã lên lịch: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Find failed notifications eligible for retry
     */
    async findFailedForRetry(beforeTime, maxAttempts, limit) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm thông báo thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Find notifications by status
     */
    async findByStatus(status, limit, offset) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm thông báo theo trạng thái: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Find urgent notifications
     */
    async findUrgentNotifications(limit) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm thông báo khẩn cấp: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Find notifications by healthcare context
     */
    async findByHealthcareContext(context, limit) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm thông báo theo bối cảnh y tế: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Map sort column names
     */
    mapSortColumn(sortBy) {
        const columnMap = {
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
    mapToRecord(notification) {
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
    mapToAggregate(record) {
        // This is a simplified mapping - in a real implementation,
        // you would need to properly reconstruct all value objects
        // and the aggregate from the stored data
        const recipient = RecipientInfo_1.RecipientInfo.fromJSON(record.recipient_data);
        const template = NotificationTemplate_1.NotificationTemplate.fromJSON ? NotificationTemplate_1.NotificationTemplate.fromJSON(record.template_data) : {};
        const content = NotificationContent_1.NotificationContent.fromJSON(record.content_data);
        const channels = record.channels.map(channelType => {
            switch (channelType) {
                case 'EMAIL': return NotificationChannel_1.NotificationChannel.createEmail();
                case 'SMS': return NotificationChannel_1.NotificationChannel.createSMS();
                case 'PUSH': return NotificationChannel_1.NotificationChannel.createPush();
                case 'IN_APP': return NotificationChannel_1.NotificationChannel.createInApp();
                case 'VOICE': return NotificationChannel_1.NotificationChannel.createVoice();
                default: return NotificationChannel_1.NotificationChannel.createEmail();
            }
        });
        // Create aggregate using the create method
        const notification = Notification_1.Notification.create({
            recipient,
            template,
            content,
            channels,
            priority: record.priority,
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
    async findByTemplateType(templateType, limit, offset) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm thông báo theo template: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Find notifications by channel
     */
    async findByChannel(channel, limit, offset) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm thông báo theo kênh: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Find notifications by date range
     */
    async findByDateRange(startDate, endDate, limit, offset) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm thông báo theo khoảng thời gian: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Find duplicate notifications
     */
    async findDuplicates(recipientId, templateType, contentHash, withinHours) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi tìm thông báo trùng lặp: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Count notifications by criteria
     */
    async countByCriteria(criteria) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi đếm thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Count notifications by status
     */
    async countByStatus(status) {
        try {
            const { count, error } = await this.supabaseClient.getRawClient()
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('status', status);
            if (error) {
                throw new Error(`Lỗi khi đếm thông báo theo trạng thái: ${error.message}`);
            }
            return count || 0;
        }
        catch (error) {
            throw new Error(`Lỗi repository khi đếm thông báo theo trạng thái: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Count notifications by recipient
     */
    async countByRecipient(recipientId) {
        try {
            const { count, error } = await this.supabaseClient.getRawClient()
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', recipientId);
            if (error) {
                throw new Error(`Lỗi khi đếm thông báo theo người nhận: ${error.message}`);
            }
            return count || 0;
        }
        catch (error) {
            throw new Error(`Lỗi repository khi đếm thông báo theo người nhận: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Delete notification by ID
     */
    async delete(id) {
        try {
            const { error } = await this.supabaseClient.getRawClient()
                .from('notifications')
                .delete()
                .eq('notification_id', id.getValue());
            if (error) {
                throw new Error(`Lỗi khi xóa thông báo: ${error.message}`);
            }
        }
        catch (error) {
            throw new Error(`Lỗi repository khi xóa thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Delete old notifications
     */
    async deleteOlderThan(date) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi xóa thông báo cũ: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Check if notification exists
     */
    async exists(id) {
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
        }
        catch (error) {
            throw new Error(`Lỗi repository khi kiểm tra tồn tại thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
}
exports.SupabaseNotificationRepository = SupabaseNotificationRepository;
//# sourceMappingURL=SupabaseNotificationRepository.js.map