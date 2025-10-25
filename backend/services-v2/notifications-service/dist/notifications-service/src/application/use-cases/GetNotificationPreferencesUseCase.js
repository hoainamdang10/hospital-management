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
    }
    async execute(query) {
        try {
            const preferences = await this.preferencesRepository.getOrCreate(query.userId, 'PATIENT');
            return { preferences };
        }
        catch (error) {
            throw new Error(`Failed to get preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.GetNotificationPreferencesUseCase = GetNotificationPreferencesUseCase;
//# sourceMappingURL=GetNotificationPreferencesUseCase.js.map