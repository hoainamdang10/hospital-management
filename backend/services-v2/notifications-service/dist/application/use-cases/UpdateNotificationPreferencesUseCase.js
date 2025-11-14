"use strict";
/**
 * UpdateNotificationPreferencesUseCase - Command Use Case
 * Update user notification preferences
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, GDPR
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNotificationPreferencesUseCase = void 0;
class UpdateNotificationPreferencesUseCase {
    constructor(preferencesRepository) {
        this.preferencesRepository = preferencesRepository;
    }
    async execute(command) {
        try {
            let preferences = await this.preferencesRepository.findByUserId(command.userId);
            if (!preferences) {
                preferences = await this.preferencesRepository.getOrCreate(command.userId, 'PATIENT');
            }
            // Update preferences
            const updatedPreferences = {
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
        }
        catch (error) {
            throw new Error(`Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.UpdateNotificationPreferencesUseCase = UpdateNotificationPreferencesUseCase;
//# sourceMappingURL=UpdateNotificationPreferencesUseCase.js.map