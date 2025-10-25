/**
 * UpdateNotificationPreferencesUseCase - Command Use Case
 * Update user notification preferences
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, GDPR
 */

import { SupabasePreferencesRepository, NotificationPreferences } from '../../infrastructure/persistence/SupabasePreferencesRepository';

export interface UpdatePreferencesCommand {
  userId: string;
  preferredChannels?: string[];
  enabledChannels?: string[];
  optOutAll?: boolean;
  optOutMarketing?: boolean;
  optOutReminders?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  preferredLanguage?: 'vi' | 'en';
  maxNotificationsPerDay?: number;
  maxSmsPerDay?: number;
  maxEmailsPerDay?: number;
}

export interface UpdatePreferencesResult {
  userId: string;
  preferences: NotificationPreferences;
  message: string;
}

export class UpdateNotificationPreferencesUseCase {
  constructor(private readonly preferencesRepository: SupabasePreferencesRepository) {}

  async execute(command: UpdatePreferencesCommand): Promise<UpdatePreferencesResult> {
    try {
      let preferences = await this.preferencesRepository.findByUserId(command.userId);

      if (!preferences) {
        preferences = await this.preferencesRepository.getOrCreate(command.userId, 'PATIENT');
      }

      // Update preferences
      const updatedPreferences: NotificationPreferences = {
        ...preferences,
        preferredChannels: command.preferredChannels || preferences.preferredChannels,
        enabledChannels: command.enabledChannels || preferences.enabledChannels,
        optOutAll: command.optOutAll !== undefined ? command.optOutAll : preferences.optOutAll,
        optOutMarketing: command.optOutMarketing !== undefined ? command.optOutMarketing : preferences.optOutMarketing,
        optOutReminders: command.optOutReminders !== undefined ? command.optOutReminders : preferences.optOutReminders,
        quietHoursEnabled: command.quietHoursEnabled !== undefined ? command.quietHoursEnabled : preferences.quietHoursEnabled,
        quietHoursStart: command.quietHoursStart || preferences.quietHoursStart,
        quietHoursEnd: command.quietHoursEnd || preferences.quietHoursEnd,
        preferredLanguage: command.preferredLanguage || preferences.preferredLanguage,
        maxNotificationsPerDay: command.maxNotificationsPerDay || preferences.maxNotificationsPerDay,
        maxSmsPerDay: command.maxSmsPerDay || preferences.maxSmsPerDay,
        maxEmailsPerDay: command.maxEmailsPerDay || preferences.maxEmailsPerDay,
        updatedAt: new Date()
      };

      await this.preferencesRepository.update(updatedPreferences);

      return {
        userId: command.userId,
        preferences: updatedPreferences,
        message: 'Preferences updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

