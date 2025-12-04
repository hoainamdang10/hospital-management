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
export interface NotificationPreferences {
    userId: string;
    recipientType: "PATIENT" | "DOCTOR" | "NURSE" | "ADMIN" | "STAFF" | "FAMILY" | "DEPARTMENT" | "EXTERNAL";
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
export declare class SupabasePreferencesRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    /**
     * Get user preferences
     */
    findByUserId(userId: string): Promise<NotificationPreferences | null>;
    /**
     * Get or create default preferences
     */
    getOrCreate(userId: string, recipientType: string, email?: string, phoneNumber?: string): Promise<NotificationPreferences>;
    /**
     * Sync contact information from source of truth (e.g. Patient Registry Service)
     * Creates preferences row if missing, otherwise updates existing contact fields
     */
    syncContactInfo(params: {
        userId: string;
        recipientType: string;
        email?: string | null;
        phoneNumber?: string | null;
        preferredLanguage?: "vi" | "en";
        preferredChannels?: Array<"EMAIL" | "SMS">;
    }): Promise<void>;
    private buildDefaultPreferences;
    /**
     * Save preferences
     */
    save(preferences: NotificationPreferences): Promise<void>;
    /**
     * Update preferences
     */
    update(preferences: NotificationPreferences): Promise<void>;
    /**
     * Check if user can receive notification (using database function)
     */
    canReceiveNotification(userId: string, channel: string, category: string, priority: string): Promise<boolean>;
    /**
     * Check rate limit (using database function)
     */
    checkRateLimit(userId: string, channel: string): Promise<boolean>;
    /**
     * Get user's preferred channels (using database function)
     */
    getPreferredChannels(userId: string): Promise<string[]>;
    /**
     * Update last notification timestamp (using database function)
     */
    updateLastNotificationTimestamp(userId: string): Promise<void>;
    /**
     * Opt out user from all notifications
     */
    optOutAll(userId: string): Promise<void>;
    /**
     * Opt in user to all notifications
     */
    optInAll(userId: string): Promise<void>;
    /**
     * Update channel preferences
     */
    updateChannelPreferences(userId: string, enabledChannels: string[]): Promise<void>;
    /**
     * Update quiet hours
     */
    updateQuietHours(userId: string, enabled: boolean, start?: string, end?: string): Promise<void>;
    /**
     * Get all users with preferences
     */
    findAll(limit?: number, offset?: number): Promise<NotificationPreferences[]>;
    /**
     * Count active preferences
     */
    count(): Promise<number>;
    private mapToRecord;
    private mapToPreferences;
    private normalizeChannelList;
}
//# sourceMappingURL=SupabasePreferencesRepository.d.ts.map