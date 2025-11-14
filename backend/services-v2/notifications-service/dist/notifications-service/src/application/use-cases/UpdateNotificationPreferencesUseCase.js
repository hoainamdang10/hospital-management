"use strict";
/**
 * UpdateNotificationPreferencesUseCase - Command Use Case
 * Update user notification preferences
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNotificationPreferencesUseCase = void 0;
class UpdateNotificationPreferencesUseCase {
    constructor(preferencesRepository) {
        this.preferencesRepository = preferencesRepository;
    }
    async execute(command) {
        try {
            // Get existing preferences
            const existing = await this.preferencesRepository.findByUserId(command.userId);
            if (!existing) {
                throw new Error('Preferences not found for user');
            }
            // Update preferences
            const updated = {
                ...existing,
                ...command.preferences,
                updatedAt: new Date()
            };
            await this.preferencesRepository.update(command.userId, updated);
            return {
                success: true,
                userId: command.userId,
                preferences: updated,
                message: 'Notification preferences updated successfully'
            };
        }
        catch (error) {
            throw new Error(`Failed to update notification preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.UpdateNotificationPreferencesUseCase = UpdateNotificationPreferencesUseCase;
//# sourceMappingURL=UpdateNotificationPreferencesUseCase.js.map