"use strict";
/**
 * GetNotificationPreferencesUseCase - Query Use Case
 * Get user notification preferences
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNotificationPreferencesUseCase = void 0;
class GetNotificationPreferencesUseCase {
    constructor(preferencesRepository) {
        this.preferencesRepository = preferencesRepository;
        this.allowedChannels = [
            "EMAIL",
            "SMS",
        ];
    }
    async execute(query) {
        try {
            const rawPreferences = await this.preferencesRepository.getOrCreate(query.userId, query.userType === "staff" ? "DOCTOR" : "PATIENT");
            const preferences = this.sanitizeChannels(rawPreferences);
            return {
                preferences,
                calendarIntegration: query.userType === "staff" ? true : undefined,
            };
        }
        catch (error) {
            throw new Error(`Failed to get preferences: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    sanitizeChannels(preferences) {
        const normalizeChannels = (channels) => {
            const unique = [];
            (channels || []).forEach((channel) => {
                const normalized = channel?.toUpperCase?.();
                if (normalized &&
                    this.allowedChannels.includes(normalized) &&
                    !unique.includes(normalized)) {
                    unique.push(normalized);
                }
            });
            return unique;
        };
        const preferred = normalizeChannels(preferences.preferredChannels);
        const enabled = normalizeChannels(preferences.enabledChannels);
        const sanitizedPreferred = preferred.length
            ? preferred
            : [...this.allowedChannels];
        const sanitizedEnabled = enabled.length ? enabled : [...sanitizedPreferred];
        const sanitizedDisabled = this.allowedChannels.filter((channel) => !sanitizedEnabled.includes(channel));
        return {
            ...preferences,
            preferredChannels: sanitizedPreferred,
            enabledChannels: sanitizedEnabled,
            disabledChannels: sanitizedDisabled,
            emailEnabled: sanitizedEnabled.includes("EMAIL"),
            smsEnabled: sanitizedEnabled.includes("SMS"),
            pushEnabled: false,
            inAppEnabled: false,
            voiceEnabled: false,
            channelPriority: sanitizedPreferred,
            pushToken: undefined,
        };
    }
}
exports.GetNotificationPreferencesUseCase = GetNotificationPreferencesUseCase;
//# sourceMappingURL=GetNotificationPreferencesUseCase.js.map