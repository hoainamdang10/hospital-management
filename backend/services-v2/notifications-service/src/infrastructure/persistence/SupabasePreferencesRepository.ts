/**
 * SupabasePreferencesRepository - User Preferences Repository
 * V2 Clean Architecture + DDD Implementation
 * Manages user notification preferences with GDPR compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, GDPR, Opt-out Management
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRecipientType } from "../../domain/services/recipient-type-normalizer";

export interface NotificationPreferences {
  userId: string;
  recipientType:
    | "PATIENT"
    | "DOCTOR"
    | "NURSE"
    | "ADMIN"
    | "STAFF"
    | "FAMILY"
    | "DEPARTMENT"
    | "EXTERNAL";
  email?: string;
  phoneNumber?: string;
  pushToken?: string;
  preferredChannels: string[];
  enabledChannels: string[];
  disabledChannels: string[];
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  voiceEnabled: boolean;
  optOutAll: boolean;
  optOutMarketing: boolean;
  optOutReminders: boolean;
  optOutEmergency: boolean;
  optOutTransactional: boolean;
  appointmentNotifications: boolean;
  billingNotifications: boolean;
  medicalNotifications: boolean;
  emergencyNotifications: boolean;
  promotionalNotifications: boolean;
  preferredLanguage: "vi" | "en";
  timezone: string;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursExceptions: string[];
  maxNotificationsPerDay?: number;
  maxNotificationsPerHour?: number;
  maxSmsPerDay: number;
  maxEmailsPerDay: number;
  batchNotifications: boolean;
  immediateDelivery: boolean;
  digestFrequency?: "NONE" | "HOURLY" | "DAILY" | "WEEKLY";
  digestTime?: string;
  channelPriority: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  lastNotificationAt?: Date;
  isActive: boolean;
}

/**
 * Preferences Repository for Supabase
 */
export class SupabasePreferencesRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Get user preferences
   */
  public async findByUserId(
    userId: string,
  ): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw new Error(`Supabase error: ${error.message}`);
      }

      return this.mapToPreferences(data);
    } catch (error) {
      throw new Error(
        `Failed to find preferences: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get or create default preferences
   */
  public async getOrCreate(
    userId: string,
    recipientType: string,
    email?: string,
    phoneNumber?: string,
  ): Promise<NotificationPreferences> {
    if (!userId) {
      // Fallback: nếu thiếu userId, trả về cấu hình mặc định trong RAM, không ghi DB
      const normalizedType = normalizeRecipientType(recipientType);
      return this.buildDefaultPreferences(
        "unknown",
        normalizedType,
        email,
        phoneNumber,
      );
    }

    let preferences = await this.findByUserId(userId);

    if (!preferences) {
      const normalizedType = normalizeRecipientType(recipientType);

      const { error } = await this.supabase
        .from("notification_preferences")
        .insert({
          user_id: userId,
          recipient_type: normalizedType,
          email,
          phone_number: phoneNumber,
        });

      if (error && !error.message?.includes("duplicate key value")) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // Fetch created preferences
      preferences = await this.findByUserId(userId);
      if (!preferences) {
        throw new Error("Failed to create default preferences");
      }
    }

    return preferences;
  }

  /**
   * Sync contact information from source of truth (e.g. Patient Registry Service)
   * Creates preferences row if missing, otherwise updates existing contact fields
   */
  public async syncContactInfo(params: {
    userId: string;
    recipientType: string;
    email?: string | null;
    phoneNumber?: string | null;
    preferredLanguage?: "vi" | "en";
    preferredChannels?: Array<"EMAIL" | "SMS">;
  }): Promise<void> {
    const {
      userId,
      recipientType,
      email,
      phoneNumber,
      preferredLanguage,
      preferredChannels,
    } = params;

    if (!userId) {
      return;
    }

    const normalizedType = normalizeRecipientType(recipientType);
    const existing = await this.findByUserId(userId);

    if (!existing) {
      const defaults = this.buildDefaultPreferences(
        userId,
        normalizedType,
        email ?? undefined,
        phoneNumber ?? undefined,
      );

      if (preferredLanguage) {
        defaults.preferredLanguage = preferredLanguage;
      }

      const normalizedChannels = this.normalizeChannelList(preferredChannels);
      if (normalizedChannels.length > 0) {
        defaults.preferredChannels = normalizedChannels;
        defaults.enabledChannels = Array.from(
          new Set([...defaults.enabledChannels, ...normalizedChannels]),
        );
      }

      const { error } = await this.supabase
        .from("notification_preferences")
        .insert(this.mapToRecord(defaults));

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      return;
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    let shouldUpdate = false;

    if (email !== undefined && email !== existing.email) {
      updatePayload.email = email;
      shouldUpdate = true;
    }

    if (phoneNumber !== undefined && phoneNumber !== existing.phoneNumber) {
      updatePayload.phone_number = phoneNumber;
      shouldUpdate = true;
    }

    if (preferredLanguage && preferredLanguage !== existing.preferredLanguage) {
      updatePayload.preferred_language = preferredLanguage;
      shouldUpdate = true;
    }

    const normalizedExistingChannels = this.normalizeChannelList(
      existing.preferredChannels,
    );
    const normalizedRequestedChannels =
      this.normalizeChannelList(preferredChannels);

    if (
      normalizedRequestedChannels.length > 0 &&
      normalizedExistingChannels.length === 0
    ) {
      updatePayload.preferred_channels = normalizedRequestedChannels;
      updatePayload.enabled_channels = Array.from(
        new Set([...existing.enabledChannels, ...normalizedRequestedChannels]),
      );
      updatePayload.email_enabled =
        updatePayload.enabled_channels.includes("EMAIL");
      updatePayload.sms_enabled =
        updatePayload.enabled_channels.includes("SMS");
      shouldUpdate = true;
    }

    if (!shouldUpdate) {
      return;
    }

    const { error } = await this.supabase
      .from("notification_preferences")
      .update(updatePayload)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  private buildDefaultPreferences(
    userId: string,
    recipientType: string,
    email?: string,
    phoneNumber?: string,
  ): NotificationPreferences {
    return {
      userId,
      recipientType: normalizeRecipientType(recipientType),
      email,
      phoneNumber,
      pushToken: undefined,
      preferredChannels: ["EMAIL"],
      enabledChannels: ["EMAIL", "SMS"],
      disabledChannels: [],
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: false,
      inAppEnabled: true,
      voiceEnabled: false,
      optOutAll: false,
      optOutMarketing: false,
      optOutReminders: false,
      optOutEmergency: false,
      optOutTransactional: false,
      appointmentNotifications: true,
      billingNotifications: true,
      medicalNotifications: true,
      emergencyNotifications: true,
      promotionalNotifications: false,
      preferredLanguage: "vi",
      timezone: "Asia/Ho_Chi_Minh",
      quietHoursEnabled: false,
      quietHoursStart: undefined,
      quietHoursEnd: undefined,
      quietHoursExceptions: ["URGENT", "EMERGENCY"],
      maxNotificationsPerDay: undefined,
      maxNotificationsPerHour: undefined,
      maxSmsPerDay: 5,
      maxEmailsPerDay: 20,
      batchNotifications: false,
      immediateDelivery: true,
      digestFrequency: undefined,
      digestTime: undefined,
      channelPriority: ["EMAIL", "SMS"],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastNotificationAt: undefined,
      isActive: true,
    };
  }

  /**
   * Save preferences
   */
  public async save(preferences: NotificationPreferences): Promise<void> {
    const record = this.mapToRecord(preferences);

    const { error } = await this.supabase
      .from("notification_preferences")
      .insert(record);

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  /**
   * Update preferences
   */
  public async update(preferences: NotificationPreferences): Promise<void> {
    const record = this.mapToRecord(preferences);
    const { user_id, created_at, ...updateData } = record;

    const { error } = await this.supabase
      .from("notification_preferences")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id);

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  /**
   * Check if user can receive notification (using database function)
   */
  public async canReceiveNotification(
    userId: string,
    channel: string,
    category: string,
    priority: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc(
      "can_user_receive_notification",
      {
        p_user_id: userId,
        p_channel: channel,
        p_category: category,
        p_priority: priority,
      },
    );

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return data === true;
  }

  /**
   * Check rate limit (using database function)
   */
  public async checkRateLimit(
    userId: string,
    channel: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc("check_rate_limit", {
      p_user_id: userId,
      p_channel: channel,
    });

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return data === true;
  }

  /**
   * Get user's preferred channels (using database function)
   */
  public async getPreferredChannels(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase.rpc(
      "get_user_preferred_channels",
      {
        p_user_id: userId,
      },
    );

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return data || ["EMAIL"];
  }

  /**
   * Update last notification timestamp (using database function)
   */
  public async updateLastNotificationTimestamp(userId: string): Promise<void> {
    const { error } = await this.supabase.rpc(
      "update_last_notification_timestamp",
      {
        p_user_id: userId,
      },
    );

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  /**
   * Opt out user from all notifications
   */
  public async optOutAll(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notification_preferences")
      .update({
        opt_out_all: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  /**
   * Opt in user to all notifications
   */
  public async optInAll(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notification_preferences")
      .update({
        opt_out_all: false,
        opt_out_marketing: false,
        opt_out_reminders: false,
        opt_out_transactional: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  /**
   * Update channel preferences
   */
  public async updateChannelPreferences(
    userId: string,
    enabledChannels: string[],
  ): Promise<void> {
    const { error } = await this.supabase
      .from("notification_preferences")
      .update({
        enabled_channels: enabledChannels,
        preferred_channels: enabledChannels.slice(0, 2), // Top 2 as preferred
        email_enabled: enabledChannels.includes("EMAIL"),
        sms_enabled: enabledChannels.includes("SMS"),
        push_enabled: enabledChannels.includes("PUSH"),
        in_app_enabled: enabledChannels.includes("IN_APP"),
        voice_enabled: enabledChannels.includes("VOICE"),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  /**
   * Update quiet hours
   */
  public async updateQuietHours(
    userId: string,
    enabled: boolean,
    start?: string,
    end?: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("notification_preferences")
      .update({
        quiet_hours_enabled: enabled,
        quiet_hours_start: start,
        quiet_hours_end: end,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  /**
   * Get all users with preferences
   */
  public async findAll(
    limit: number = 100,
    offset: number = 0,
  ): Promise<NotificationPreferences[]> {
    const { data, error } = await this.supabase
      .from("notification_preferences")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return (data || []).map((record) => this.mapToPreferences(record));
  }

  /**
   * Count active preferences
   */
  public async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from("notification_preferences")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    return count || 0;
  }

  // ==================== Mapping Methods ====================

  private mapToRecord(preferences: NotificationPreferences): any {
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
      is_active: preferences.isActive,
    };
  }

  private mapToPreferences(record: any): NotificationPreferences {
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
      lastNotificationAt: record.last_notification_at
        ? new Date(record.last_notification_at)
        : undefined,
      isActive: record.is_active,
    };
  }

  private normalizeChannelList(
    channels?: Array<string | null> | null,
  ): Array<"EMAIL" | "SMS"> {
    if (!channels || channels.length === 0) {
      return [];
    }

    const allowed: Array<"EMAIL" | "SMS"> = ["EMAIL", "SMS"];

    return Array.from(
      new Set(
        channels
          .map((channel) => channel?.toUpperCase())
          .filter((channel): channel is "EMAIL" | "SMS" =>
            allowed.includes(channel as "EMAIL" | "SMS"),
          ),
      ),
    );
  }
}
