/**
 * GetNotificationPreferencesUseCase - Query Use Case
 * Get user notification preferences
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query
 */
import { SupabasePreferencesRepository, NotificationPreferences } from "../../infrastructure/persistence/SupabasePreferencesRepository";
export interface GetPreferencesQuery {
    userId: string;
    userType?: "patient" | "staff";
}
export interface GetPreferencesResult {
    preferences: NotificationPreferences;
    calendarIntegration?: boolean;
}
export declare class GetNotificationPreferencesUseCase {
    private readonly preferencesRepository;
    private readonly allowedChannels;
    constructor(preferencesRepository: SupabasePreferencesRepository);
    execute(query: GetPreferencesQuery): Promise<GetPreferencesResult>;
    private sanitizeChannels;
}
//# sourceMappingURL=GetNotificationPreferencesUseCase.d.ts.map