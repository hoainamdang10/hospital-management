"use strict";
/**
 * SupabaseNotificationRepository - Infrastructure Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Complete Supabase implementation matching new database schema
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseNotificationRepository = void 0;
const Notification_1 = require("../../domain/aggregates/Notification");
const RecipientInfo_1 = require("../../domain/value-objects/RecipientInfo");
const NotificationContent_1 = require("../../domain/value-objects/NotificationContent");
const NotificationChannel_1 = require("../../domain/value-objects/NotificationChannel");
/**
 * Supabase Notification Repository
 * Implements full INotificationRepository interface
 */
class SupabaseNotificationRepository {
    constructor(supabase, eventBus) {
        this.supabase = supabase;
        this.eventBus = eventBus;
    }
    // ==================== Core CRUD Operations ====================
    /**
     * Save notification aggregate
     */
    async save(notification) {
        try {
            const record = this.mapToRecord(notification);
            const { error } = await this.supabase
                .from("notifications")
                .insert(record);
            if (error) {
                // Allow idempotent re-insert without throwing
                if (error.message?.includes("duplicate key value")) {
                    return;
                }
                throw new Error(`Supabase error: ${error.message}`);
            }
            // Publish domain events after successful save
            await this.publishDomainEvents(notification);
        }
        catch (error) {
            throw new Error(`Failed to save notification: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Update existing notification
     */
    async update(notification) {
        try {
            const record = this.mapToRecord(notification);
            const { id, notification_id, created_at, created_by, ...updateData } = record;
            const { error } = await this.supabase
                .from("notifications")
                .update(updateData)
                .eq("notification_id", notification_id);
            if (error) {
                throw new Error(`Supabase error: ${error.message}`);
            }
            // Publish domain events after successful update
            await this.publishDomainEvents(notification);
        }
        catch (error) {
            throw new Error(`Failed to update notification: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Publish domain events from aggregate
     */
    async publishDomainEvents(notification) {
        if (!this.eventBus) {
            return; // EventBus not configured, skip publishing
        }
        const events = notification.getUncommittedEvents();
        for (const event of events) {
            try {
                await this.eventBus.publish(event);
            }
            catch (error) {
                console.error(`Failed to publish event ${event.eventType}:`, error);
                // Don't throw - event publishing failure shouldn't fail the save operation
            }
        }
        notification.markEventsAsCommitted();
    }
    /**
     * Find notification by ID
     */
    async findById(id) {
        try {
            const { data, error } = await this.supabase
                .from("notifications")
                .select("*")
                .eq("notification_id", id.value)
                .eq("is_deleted", false)
                .single();
            if (error) {
                if (error.code === "PGRST116")
                    return null; // Not found
                throw new Error(`Supabase error: ${error.message}`);
            }
            return data ? this.mapToAggregate(data) : null;
        }
        catch (error) {
            throw new Error(`Failed to find notification by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    // ==================== Query Methods ====================
    /**
     * Find notifications by recipient
     */
    async findByRecipient(recipientId, limit = 20, offset = 0) {
        try {
            const { data, error } = await this.supabase
                .from("notifications")
                .select("*")
                .eq("recipient_id", recipientId)
                .eq("is_deleted", false)
                .order("created_at", { ascending: false })
                .range(offset, offset + limit - 1);
            if (error)
                throw new Error(`Supabase error: ${error.message}`);
            return (data || []).map((record) => this.mapToAggregate(record));
        }
        catch (error) {
            throw new Error(`Failed to find notifications by recipient: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Find notifications by multiple criteria
     */
    async findByCriteria(criteria) {
        try {
            let query = this.supabase
                .from("notifications")
                .select("*")
                .eq("is_deleted", false);
            // Apply filters
            if (criteria.recipientId)
                query = query.eq("recipient_id", criteria.recipientId);
            if (criteria.recipientType)
                query = query.eq("recipient_type", criteria.recipientType);
            if (criteria.templateType)
                query = query.eq("template_type", criteria.templateType);
            if (criteria.status)
                query = query.eq("status", criteria.status);
            if (criteria.priority)
                query = query.eq("priority", criteria.priority);
            if (criteria.scheduledAfter)
                query = query.gte("scheduled_at", criteria.scheduledAfter.toISOString());
            if (criteria.scheduledBefore)
                query = query.lte("scheduled_at", criteria.scheduledBefore.toISOString());
            if (criteria.createdAfter)
                query = query.gte("created_at", criteria.createdAfter.toISOString());
            if (criteria.createdBefore)
                query = query.lte("created_at", criteria.createdBefore.toISOString());
            // Read status filter
            if (criteria.isRead !== undefined) {
                if (criteria.isRead) {
                    query = query.not("read_at", "is", null);
                }
                else {
                    query = query.is("read_at", null);
                }
            }
            // Healthcare context filters
            if (criteria.healthcareContext?.patientId) {
                query = query.contains("healthcare_context", {
                    patientId: criteria.healthcareContext.patientId,
                });
            }
            if (criteria.healthcareContext?.appointmentId) {
                query = query.contains("healthcare_context", {
                    appointmentId: criteria.healthcareContext.appointmentId,
                });
            }
            // Sorting
            const sortBy = this.mapSortColumn(criteria.sortBy || "createdAt");
            query = query.order(sortBy, { ascending: criteria.sortOrder === "ASC" });
            // Pagination
            if (criteria.limit) {
                const offset = criteria.offset || 0;
                query = query.range(offset, offset + criteria.limit - 1);
            }
            const { data, error } = await query;
            if (error)
                throw new Error(`Supabase error: ${error.message}`);
            return (data || []).map((record) => this.mapToAggregate(record));
        }
        catch (error) {
            throw new Error(`Failed to find notifications by criteria: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Find scheduled notifications ready for processing (using database function)
     */
    async findScheduledForProcessing(_beforeTime, limit = 100) {
        try {
            const { data, error } = await this.supabase.rpc("get_scheduled_notifications_due", { p_limit: limit });
            if (error)
                throw new Error(`Supabase error: ${error.message}`);
            // Map RPC results to full notifications
            const notificationIds = (data || []).map((row) => row.notification_id);
            if (notificationIds.length === 0)
                return [];
            return await this.findByNotificationIds(notificationIds);
        }
        catch (error) {
            throw new Error(`Failed to find scheduled notifications: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Find failed notifications eligible for retry (using database function)
     */
    async findFailedForRetry(_beforeTime, _maxAttempts = 3, limit = 100) {
        try {
            const { data, error } = await this.supabase.rpc("get_notifications_for_retry", { p_limit: limit });
            if (error)
                throw new Error(`Supabase error: ${error.message}`);
            const notificationIds = (data || []).map((row) => row.notification_id);
            if (notificationIds.length === 0)
                return [];
            return await this.findByNotificationIds(notificationIds);
        }
        catch (error) {
            throw new Error(`Failed to find failed notifications for retry: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Helper: Find notifications by IDs
     */
    async findByNotificationIds(ids) {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .in("notification_id", ids)
            .eq("is_deleted", false);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    /**
     * Find notifications by status
     */
    async findByStatus(status, limit = 20, offset = 0) {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .eq("status", status)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    /**
     * Find urgent notifications
     */
    async findUrgentNotifications(limit = 100) {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .eq("priority", "URGENT")
            .in("status", ["PENDING", "SCHEDULED", "PROCESSING", "FAILED"])
            .eq("is_deleted", false)
            .order("scheduled_at", { ascending: true })
            .limit(limit);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    /**
     * Find notifications by healthcare context
     */
    async findByHealthcareContext(context, limit = 20) {
        try {
            let query = this.supabase
                .from("notifications")
                .select("*")
                .eq("is_deleted", false);
            if (context.patientId) {
                query = query.contains("healthcare_context", {
                    patientId: context.patientId,
                });
            }
            if (context.doctorId) {
                query = query.contains("healthcare_context", {
                    doctorId: context.doctorId,
                });
            }
            if (context.appointmentId) {
                query = query.contains("healthcare_context", {
                    appointmentId: context.appointmentId,
                });
            }
            if (context.medicalRecordId) {
                query = query.contains("healthcare_context", {
                    medicalRecordId: context.medicalRecordId,
                });
            }
            const { data, error } = await query
                .order("created_at", { ascending: false })
                .limit(limit);
            if (error)
                throw new Error(`Supabase error: ${error.message}`);
            return (data || []).map((record) => this.mapToAggregate(record));
        }
        catch (error) {
            throw new Error(`Failed to find by healthcare context: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async findByTemplateType(templateType, limit = 20, offset = 0) {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .eq("template_type", templateType)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    async findByChannel(channel, limit = 20, offset = 0) {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .contains("successful_channels", [channel])
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    async findByDateRange(startDate, endDate, limit = 100, offset = 0) {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    async findDuplicates(recipientId, templateType, _contentHash, withinHours = 24) {
        const cutoffTime = new Date(Date.now() - withinHours * 60 * 60 * 1000);
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .eq("recipient_id", recipientId)
            .eq("template_type", templateType)
            .gte("created_at", cutoffTime.toISOString())
            .eq("is_deleted", false);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    // ==================== Count Methods ====================
    async countByCriteria(criteria) {
        let query = this.supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("is_deleted", false);
        if (criteria.recipientId)
            query = query.eq("recipient_id", criteria.recipientId);
        if (criteria.status)
            query = query.eq("status", criteria.status);
        if (criteria.priority)
            query = query.eq("priority", criteria.priority);
        const { count, error } = await query;
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return count || 0;
    }
    async countByStatus(status) {
        const { count, error } = await this.supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("status", status)
            .eq("is_deleted", false);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return count || 0;
    }
    async countByRecipient(recipientId) {
        const { count, error } = await this.supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("recipient_id", recipientId)
            .eq("is_deleted", false);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return count || 0;
    }
    // ==================== Delete Methods ====================
    async delete(id) {
        const { error } = await this.supabase
            .from("notifications")
            .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: "system",
        })
            .eq("notification_id", id.value);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    async deleteOlderThan(date) {
        const { data, error } = await this.supabase.rpc("cleanup_old_notifications", {
            p_days_old: Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)),
        });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return data || 0;
    }
    async deleteByCriteria(criteria) {
        let query = this.supabase
            .from("notifications")
            .update({ is_deleted: true, deleted_at: new Date().toISOString() });
        if (criteria.status)
            query = query.eq("status", criteria.status);
        if (criteria.recipientId)
            query = query.eq("recipient_id", criteria.recipientId);
        const { data, error } = await query.select("notification_id");
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).length;
    }
    async exists(id) {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("notification_id")
            .eq("notification_id", id.value)
            .eq("is_deleted", false)
            .single();
        if (error && error.code === "PGRST116")
            return false;
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return !!data;
    }
    // ==================== Statistics & Metrics ====================
    async getStatistics(dateRange) {
        try {
            let query = this.supabase
                .from("notifications")
                .select("*")
                .eq("is_deleted", false);
            if (dateRange) {
                query = query
                    .gte("created_at", dateRange.start.toISOString())
                    .lte("created_at", dateRange.end.toISOString());
            }
            const { data, error } = await query;
            if (error)
                throw new Error(`Supabase error: ${error.message}`);
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
                    last24Hours: notifications.filter((n) => new Date(n.created_at) >
                        new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
                    lastWeek: notifications.filter((n) => new Date(n.created_at) >
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
                    lastMonth: notifications.filter((n) => new Date(n.created_at) >
                        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
                },
            };
        }
        catch (error) {
            throw new Error(`Failed to get statistics: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async getDeliveryMetrics(criteria) {
        const notifications = criteria
            ? await this.findByCriteria(criteria)
            : await this.findByCriteria({ limit: 100 });
        return notifications.map((n) => ({
            notificationId: n.id,
            recipientId: n.recipient.getRecipientId(),
            templateType: n.templateType,
            channels: n.channels.map((c) => c.getType()),
            scheduledAt: n.createdAt,
            sentAt: n.sentAt,
            deliveryTime: n.sentAt
                ? n.sentAt.getTime() - n.createdAt.getTime()
                : undefined,
            status: n.status,
            successfulChannels: [],
            failedChannels: [],
            retryAttempts: 0,
            cost: 0,
        }));
    }
    async getNotificationsRequiringAttention() {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .eq("priority", "URGENT")
            .eq("status", "FAILED")
            .eq("is_deleted", false)
            .order("created_at", { ascending: true })
            .limit(50);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    async getRecipientHistory(recipientId, limit = 50, offset = 0) {
        return this.findByRecipient(recipientId, limit, offset);
    }
    async getRecentNotifications(limit = 20) {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .limit(limit);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    async findByCorrelationId(correlationId) {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .contains("metadata", { correlationId })
            .eq("is_deleted", false)
            .order("created_at", { ascending: true });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    async findOverdueNotifications(overdueThreshold = 60) {
        const cutoffTime = new Date(Date.now() - overdueThreshold * 60 * 1000);
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .eq("status", "SCHEDULED")
            .lte("scheduled_at", cutoffTime.toISOString())
            .eq("is_deleted", false)
            .order("scheduled_at", { ascending: true });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    async findHighRetryNotifications(minRetryCount = 3) {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .gte("retry_count", minRetryCount)
            .eq("is_deleted", false)
            .order("retry_count", { ascending: false })
            .limit(50);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    async findByPriorityAndStatus(priority, status, limit = 20) {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("*")
            .eq("priority", priority)
            .eq("status", status)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .limit(limit);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map((record) => this.mapToAggregate(record));
    }
    // ==================== Update Methods ====================
    async updateStatus(id, status) {
        const { error } = await this.supabase
            .from("notifications")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("notification_id", id.value);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    async updateRetryInfo(id, retryCount, nextRetryAt) {
        const { error } = await this.supabase
            .from("notifications")
            .update({
            retry_count: retryCount,
            next_retry_at: nextRetryAt?.toISOString(),
            last_retry_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .eq("notification_id", id.value);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    async markAsProcessed(id, _processedAt, deliveryResults) {
        const { error } = await this.supabase.rpc("mark_notification_as_sent", {
            p_notification_id: id.value,
            p_delivery_results: deliveryResults,
        });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    async markAsFailed(id, failureReason, _failedAt) {
        const deliveryResults = [{ channel: "ALL", success: false, failureReason }];
        const { error } = await this.supabase.rpc("mark_notification_as_failed", {
            p_notification_id: id.value,
            p_delivery_results: deliveryResults,
            p_should_retry: true,
        });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    async markAsRead(id, readAt) {
        const { error } = await this.supabase
            .from("notifications")
            .update({
            read_at: readAt?.toISOString() || null,
            updated_at: new Date().toISOString(),
        })
            .eq("notification_id", id.value);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    async bulkUpdate(ids, updates) {
        const notificationIds = ids.map((id) => id.value);
        const updateData = { updated_at: new Date().toISOString() };
        if (updates.status)
            updateData.status = updates.status;
        if (updates.retryCount !== undefined)
            updateData.retry_count = updates.retryCount;
        if (updates.nextRetryAt)
            updateData.next_retry_at = updates.nextRetryAt.toISOString();
        const { error } = await this.supabase
            .from("notifications")
            .update(updateData)
            .in("notification_id", notificationIds);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    // ==================== Analytics & Health ====================
    async getQueueSize(priority) {
        let query = this.supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .in("status", ["SCHEDULED", "PROCESSING"])
            .eq("is_deleted", false);
        if (priority)
            query = query.eq("priority", priority);
        const { count, error } = await query;
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return count || 0;
    }
    async getAverageProcessingTime(_templateType, channel) {
        // Calculate from delivery_results table
        let query = this.supabase
            .from("notification_delivery_results")
            .select("delivery_time_ms");
        if (channel)
            query = query.eq("channel", channel);
        const { data, error } = await query;
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        if (!data || data.length === 0)
            return 0;
        const sum = data.reduce((acc, row) => acc + (row.delivery_time_ms || 0), 0);
        return Math.round(sum / data.length);
    }
    async getFailureRateByChannel(dateRange) {
        const { data, error } = await this.supabase.rpc("get_delivery_stats_by_channel", {
            p_start_date: dateRange?.start.toISOString(),
            p_end_date: dateRange?.end.toISOString(),
        });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        const result = {};
        (data || []).forEach((row) => {
            result[row.channel] = 100 - (row.delivery_rate || 0);
        });
        return result;
    }
    async getSuccessRateByTemplateType(dateRange) {
        let query = this.supabase
            .from("notifications")
            .select("template_type, status")
            .eq("is_deleted", false);
        if (dateRange) {
            query = query
                .gte("created_at", dateRange.start.toISOString())
                .lte("created_at", dateRange.end.toISOString());
        }
        const { data, error } = await query;
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        const grouped = (data || []).reduce((acc, row) => {
            if (!acc[row.template_type]) {
                acc[row.template_type] = { total: 0, success: 0 };
            }
            acc[row.template_type].total++;
            if (row.status === "SENT" || row.status === "DELIVERED") {
                acc[row.template_type].success++;
            }
            return acc;
        }, {});
        const result = {};
        Object.keys(grouped).forEach((key) => {
            result[key] = (grouped[key].success / grouped[key].total) * 100;
        });
        return result;
    }
    async getPeakUsageHours() {
        const { data, error } = await this.supabase
            .from("notifications")
            .select("created_at")
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .eq("is_deleted", false);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        const hourCounts = {};
        (data || []).forEach((row) => {
            const hour = new Date(row.created_at).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        return hourCounts;
    }
    async getNotificationTrends(days) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const { data, error } = await this.supabase
            .from("notifications")
            .select("created_at, status")
            .gte("created_at", startDate.toISOString())
            .eq("is_deleted", false);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        const grouped = (data || []).reduce((acc, row) => {
            const date = new Date(row.created_at).toISOString().split("T")[0];
            if (!acc[date]) {
                acc[date] = {
                    date: new Date(date),
                    total: 0,
                    successful: 0,
                    failed: 0,
                };
            }
            acc[date].total++;
            if (row.status === "SENT" || row.status === "DELIVERED")
                acc[date].successful++;
            if (row.status === "FAILED")
                acc[date].failed++;
            return acc;
        }, {});
        return Object.values(grouped);
    }
    async archiveOldNotifications(olderThanDays) {
        return this.deleteOlderThan(new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000));
    }
    async getHealthCheck() {
        const scheduled = await this.countByStatus("SCHEDULED");
        const processing = await this.countByStatus("PROCESSING");
        const pending = scheduled + processing;
        const failed = await this.countByStatus("FAILED");
        const overdue = (await this.findOverdueNotifications(60)).length;
        const avgTime = await this.getAverageProcessingTime();
        return {
            isHealthy: failed < 100 && overdue < 50,
            pendingNotifications: pending,
            failedNotifications: failed,
            overdueNotifications: overdue,
            averageResponseTime: avgTime,
        };
    }
    async optimize() {
        // Run ANALYZE on tables
        await this.supabase.rpc("run_daily_maintenance");
    }
    async getRepositoryStats() {
        const { count } = await this.supabase
            .from("notifications")
            .select("*", { count: "exact", head: true });
        return {
            totalRecords: count || 0,
            indexHealth: {},
            queryPerformance: {},
            storageSize: 0,
        };
    }
    // ==================== Helper Methods ====================
    mapSortColumn(sortBy) {
        const columnMap = {
            createdAt: "created_at",
            scheduledAt: "scheduled_at",
            priority: "priority",
            status: "status",
        };
        return columnMap[sortBy] || "created_at";
    }
    mapToRecord(notification) {
        const contactInfo = notification.recipient.getContactInfo();
        return {
            notification_id: notification.id,
            recipient_id: notification.recipient.getRecipientId(),
            recipient_type: notification.recipient.getRecipientType(),
            recipient_name: notification.recipient.getFullName(),
            recipient_email: contactInfo.email,
            recipient_phone: contactInfo.phoneNumber,
            template_type: notification.templateType,
            subject: notification.content.getSubject() || "No Subject",
            body: notification.content.getBody(),
            html_body: null, // Not supported in current NotificationContent
            channels: notification.channels.map((c) => c.getType()),
            status: notification.status,
            priority: notification.priority,
            sent_at: notification.sentAt?.toISOString(),
            delivered_at: notification.deliveredAt?.toISOString(),
            read_at: notification.readAt?.toISOString(),
            delivery_results: notification.deliveryResults,
            successful_channels: notification.deliveryResults
                ?.filter((r) => r.success)
                .map((r) => r.channel) || [],
            failed_channels: notification.deliveryResults
                ?.filter((r) => !r.success)
                .map((r) => r.channel) || [],
            healthcare_context: notification.metadata.healthcareContext || {},
            metadata: notification.metadata,
            created_at: notification.createdAt.toISOString(),
            updated_at: notification.updatedAt.toISOString(),
        };
    }
    mapToAggregate(record) {
        const recipient = RecipientInfo_1.RecipientInfo.create({
            recipientId: record.recipient_id,
            recipientType: record.recipient_type,
            fullName: record.recipient_name || "Unknown",
            contactInfo: {
                email: record.recipient_email,
                phoneNumber: record.recipient_phone,
            },
            preferences: {
                preferredChannels: ["EMAIL"],
                timezone: "Asia/Ho_Chi_Minh",
                language: "vi",
                optOut: { marketing: false, reminders: false, emergency: false },
            },
        });
        const content = NotificationContent_1.NotificationContent.create({
            subject: record.subject,
            body: record.body,
            footer: undefined,
            contentType: "TEXT",
            language: "vi",
        });
        const channels = Array.isArray(record.channels)
            ? record.channels.map((ch) => NotificationChannel_1.NotificationChannel.create(ch))
            : [];
        const notification = Notification_1.Notification.create({
            recipient,
            templateType: record.template_type,
            content,
            channels,
            priority: record.priority,
            metadata: {
                source: record.metadata?.source || "unknown",
                correlationId: record.metadata?.correlationId,
                userId: record.metadata?.userId,
                sessionId: record.metadata?.sessionId,
                healthcareContext: record.healthcare_context,
            },
        });
        // Set additional fields from database
        if (record.sent_at) {
            notification.props.sentAt = new Date(record.sent_at);
        }
        if (record.delivered_at) {
            notification.props.deliveredAt = new Date(record.delivered_at);
        }
        if (record.read_at) {
            notification.props.readAt = new Date(record.read_at);
        }
        if (record.status) {
            notification.props.status = record.status;
        }
        if (record.delivery_results) {
            notification.props.deliveryResults = record.delivery_results;
        }
        if (record.created_at) {
            notification.props.createdAt = new Date(record.created_at);
        }
        if (record.updated_at) {
            notification.props.updatedAt = new Date(record.updated_at);
        }
        return notification;
    }
    groupByStatus(notifications) {
        const result = {
            DRAFT: 0,
            SCHEDULED: 0,
            PROCESSING: 0,
            SENT: 0,
            PARTIALLY_SENT: 0,
            FAILED: 0,
            CANCELLED: 0,
            EXPIRED: 0,
        };
        notifications.forEach((n) => {
            result[n.status] = (result[n.status] || 0) + 1;
        });
        return result;
    }
    groupByPriority(notifications) {
        const result = { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 };
        notifications.forEach((n) => {
            result[n.priority] =
                (result[n.priority] || 0) + 1;
        });
        return result;
    }
    groupByChannel(notifications) {
        const result = {};
        notifications.forEach((n) => {
            const channels = Array.isArray(n.successful_channels)
                ? n.successful_channels
                : [];
            channels.forEach((ch) => {
                result[ch] = (result[ch] || 0) + 1;
            });
        });
        return result;
    }
    groupByTemplateType(notifications) {
        const result = {};
        notifications.forEach((n) => {
            result[n.template_type] = (result[n.template_type] || 0) + 1;
        });
        return result;
    }
    calculateSuccessRate(notifications) {
        if (notifications.length === 0)
            return 0;
        const successful = notifications.filter((n) => n.status === "SENT" || n.status === "DELIVERED").length;
        return (successful / notifications.length) * 100;
    }
    calculateAvgDeliveryTime(notifications) {
        const withDeliveryTime = notifications.filter((n) => n.sent_at && n.created_at);
        if (withDeliveryTime.length === 0)
            return 0;
        const sum = withDeliveryTime.reduce((acc, n) => {
            const deliveryTime = new Date(n.sent_at).getTime() - new Date(n.created_at).getTime();
            return acc + deliveryTime;
        }, 0);
        return Math.round(sum / withDeliveryTime.length);
    }
}
exports.SupabaseNotificationRepository = SupabaseNotificationRepository;
//# sourceMappingURL=SupabaseNotificationRepository.js.map