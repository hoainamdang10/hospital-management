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
export declare class UpdateNotificationPreferencesUseCase {
    private readonly preferencesRepository;
    constructor(preferencesRepository: SupabasePreferencesRepository);
    execute(command: UpdatePreferencesCommand): Promise<UpdatePreferencesResult>;
}
//# sourceMappingURL=UpdateNotificationPreferencesUseCase.d.ts.map