"use strict";
/**
 * SupabasePreferencesRepository - User Preferences Repository
 * V2 Clean Architecture + DDD Implementation
 * Manages user notification preferences with GDPR compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, GDPR, Opt-out Management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabasePreferencesRepository = void 0;
/**
 * Preferences Repository for Supabase
 */
class SupabasePreferencesRepository {
    constructor(supabase) {
        this.supabase = supabase;
    }
    /**
     * Get user preferences
     */
    async findByUserId(userId) {
        try {
            const { data, error } = await this.supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw new Error(`Supabase error: ${error.message}`);
            }
            return this.mapToPreferences(data);
        }
        catch (error) {
            throw new Error(`Failed to find preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get or create default preferences
     */
    async getOrCreate(userId, recipientType, email, phoneNumber) {
        let preferences = await this.findByUserId(userId);
        if (!preferences) {
            // Create using database function
            const { error } = await this.supabase
                .rpc('create_default_preferences', {
                p_user_id: userId,
                p_recipient_type: recipientType,
                p_email: email,
                p_phone_number: phoneNumber
            });
            if (error)
                throw new Error(`Supabase error: ${error.message}`);
            // Fetch created preferences
            preferences = await this.findByUserId(userId);
            if (!preferences) {
                throw new Error('Failed to create default preferences');
            }
        }
        return preferences;
    }
    /**
     * Save preferences
     */
    async save(preferences) {
        const record = this.mapToRecord(preferences);
        const { error } = await this.supabase
            .from('notification_preferences')
            .insert(record);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    /**
     * Update preferences
     */
    async update(preferences) {
        const record = this.mapToRecord(preferences);
        const { user_id, created_at, ...updateData } = record;
        const { error } = await this.supabase
            .from('notification_preferences')
            .update({
            ...updateData,
            updated_at: new Date().toISOString()
        })
            .eq('user_id', user_id);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    /**
     * Check if user can receive notification (using database function)
     */
    async canReceiveNotification(userId, channel, category, priority) {
        const { data, error } = await this.supabase
            .rpc('can_user_receive_notification', {
            p_user_id: userId,
            p_channel: channel,
            p_category: category,
            p_priority: priority
        });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return data === true;
    }
    /**
     * Check rate limit (using database function)
     */
    async checkRateLimit(userId, channel) {
        const { data, error } = await this.supabase
            .rpc('check_rate_limit', {
            p_user_id: userId,
            p_channel: channel
        });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return data === true;
    }
    /**
     * Get user's preferred channels (using database function)
     */
    async getPreferredChannels(userId) {
        const { data, error } = await this.supabase
            .rpc('get_user_preferred_channels', {
            p_user_id: userId
        });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return data || ['EMAIL'];
    }
    /**
     * Update last notification timestamp (using database function)
     */
    async updateLastNotificationTimestamp(userId) {
        const { error } = await this.supabase
            .rpc('update_last_notification_timestamp', {
            p_user_id: userId
        });
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    /**
     * Opt out user from all notifications
     */
    async optOutAll(userId) {
        const { error } = await this.supabase
            .from('notification_preferences')
            .update({
            opt_out_all: true,
            updated_at: new Date().toISOString()
        })
            .eq('user_id', userId);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    /**
     * Opt in user to all notifications
     */
    async optInAll(userId) {
        const { error } = await this.supabase
            .from('notification_preferences')
            .update({
            opt_out_all: false,
            opt_out_marketing: false,
            opt_out_reminders: false,
            opt_out_transactional: false,
            updated_at: new Date().toISOString()
        })
            .eq('user_id', userId);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    /**
     * Update channel preferences
     */
    async updateChannelPreferences(userId, enabledChannels) {
        const { error } = await this.supabase
            .from('notification_preferences')
            .update({
            enabled_channels: enabledChannels,
            preferred_channels: enabledChannels.slice(0, 2), // Top 2 as preferred
            email_enabled: enabledChannels.includes('EMAIL'),
            sms_enabled: enabledChannels.includes('SMS'),
            push_enabled: enabledChannels.includes('PUSH'),
            in_app_enabled: enabledChannels.includes('IN_APP'),
            voice_enabled: enabledChannels.includes('VOICE'),
            updated_at: new Date().toISOString()
        })
            .eq('user_id', userId);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    /**
     * Update quiet hours
     */
    async updateQuietHours(userId, enabled, start, end) {
        const { error } = await this.supabase
            .from('notification_preferences')
            .update({
            quiet_hours_enabled: enabled,
            quiet_hours_start: start,
            quiet_hours_end: end,
            updated_at: new Date().toISOString()
        })
            .eq('user_id', userId);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
    }
    /**
     * Get all users with preferences
     */
    async findAll(limit = 100, offset = 0) {
        const { data, error } = await this.supabase
            .from('notification_preferences')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return (data || []).map(record => this.mapToPreferences(record));
    }
    /**
     * Count active preferences
     */
    async count() {
        const { count, error } = await this.supabase
            .from('notification_preferences')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        if (error)
            throw new Error(`Supabase error: ${error.message}`);
        return count || 0;
    }
    // ==================== Mapping Methods ====================
    mapToRecord(preferences) {
        return {
            user_id: preferences.userId,
            recipient_type: preferences.recipientType,
            email: preferences.email,
            phone_number: preferences.phoneNumber,
            push_token: preferences.pushToken,
            preferred_channels: preferences.preferredChannels,
            enabled_channels: preferences.enabledChannels,
            disabled_channels: preferences.disabledChannels,
            email_enabled: preferences.emailEnabled,
            sms_enabled: preferences.smsEnabled,
            push_enabled: preferences.pushEnabled,
            in_app_enabled: preferences.inAppEnabled,
            voice_enabled: preferences.voiceEnabled,
            opt_out_all: preferences.optOutAll,
            opt_out_marketing: preferences.optOutMarketing,
            opt_out_reminders: preferences.optOutReminders,
            opt_out_emergency: preferences.optOutEmergency,
            opt_out_transactional: preferences.optOutTransactional,
            appointment_notifications: preferences.appointmentNotifications,
            billing_notifications: preferences.billingNotifications,
            medical_notifications: preferences.medicalNotifications,
            emergency_notifications: preferences.emergencyNotifications,
            promotional_notifications: preferences.promotionalNotifications,
            preferred_language: preferences.preferredLanguage,
            timezone: preferences.timezone,
            quiet_hours_enabled: preferences.quietHoursEnabled,
            quiet_hours_start: preferences.quietHoursStart,
            quiet_hours_end: preferences.quietHoursEnd,
            quiet_hours_exceptions: preferences.quietHoursExceptions,
            max_notifications_per_day: preferences.maxNotificationsPerDay,
            max_notifications_per_hour: preferences.maxNotificationsPerHour,
            max_sms_per_day: preferences.maxSmsPerDay,
            max_emails_per_day: preferences.maxEmailsPerDay,
            batch_notifications: preferences.batchNotifications,
            immediate_delivery: preferences.immediateDelivery,
            digest_frequency: preferences.digestFrequency,
            digest_time: preferences.digestTime,
            channel_priority: preferences.channelPriority,
            metadata: preferences.metadata,
            is_active: preferences.isActive
        };
    }
    mapToPreferences(record) {
        return {
            userId: record.user_id,
            recipientType: record.recipient_type,
            email: record.email,
            phoneNumber: record.phone_number,
            pushToken: record.push_token,
            preferredChannels: record.preferred_channels || [],
            enabledChannels: record.enabled_channels || [],
            disabledChannels: record.disabled_channels || [],
            emailEnabled: record.email_enabled,
            smsEnabled: record.sms_enabled,
            pushEnabled: record.push_enabled,
            inAppEnabled: record.in_app_enabled,
            voiceEnabled: record.voice_enabled,
            optOutAll: record.opt_out_all,
            optOutMarketing: record.opt_out_marketing,
            optOutReminders: record.opt_out_reminders,
            optOutEmergency: record.opt_out_emergency,
            optOutTransactional: record.opt_out_transactional,
            appointmentNotifications: record.appointment_notifications,
            billingNotifications: record.billing_notifications,
            medicalNotifications: record.medical_notifications,
            emergencyNotifications: record.emergency_notifications,
            promotionalNotifications: record.promotional_notifications,
            preferredLanguage: record.preferred_language,
            timezone: record.timezone,
            quietHoursEnabled: record.quiet_hours_enabled,
            quietHoursStart: record.quiet_hours_start,
            quietHoursEnd: record.quiet_hours_end,
            quietHoursExceptions: record.quiet_hours_exceptions || [],
            maxNotificationsPerDay: record.max_notifications_per_day,
            maxNotificationsPerHour: record.max_notifications_per_hour,
            maxSmsPerDay: record.max_sms_per_day,
            maxEmailsPerDay: record.max_emails_per_day,
            batchNotifications: record.batch_notifications,
            immediateDelivery: record.immediate_delivery,
            digestFrequency: record.digest_frequency,
            digestTime: record.digest_time,
            channelPriority: record.channel_priority,
            metadata: record.metadata,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
            lastNotificationAt: record.last_notification_at ? new Date(record.last_notification_at) : undefined,
            isActive: record.is_active
        };
    }
}
exports.SupabasePreferencesRepository = SupabasePreferencesRepository;
//# sourceMappingURL=SupabasePreferencesRepository.js.map