/**
 * UpdateNotificationPreferencesUseCase - Command Use Case
 * Update user notification preferences
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IPreferencesRepository } from '../../domain/repositories/IPreferencesRepository';
export interface UpdatePreferencesCommand {
    userId: string;
    preferences: {
        emailEnabled?: boolean;
        smsEnabled?: boolean;
        pushEnabled?: boolean;
        inAppEnabled?: boolean;
        preferredChannels?: string[];
        enabledChannels?: string[];
        quietHoursEnabled?: boolean;
        quietHoursStart?: string;
        quietHoursEnd?: string;
        timezone?: string;
        language?: string;
        maxNotificationsPerDay?: number;
        appointmentReminders?: boolean;
        appointmentReminderHours?: number;
        paymentReminders?: boolean;
        medicalRecordUpdates?: boolean;
        emergencyAlerts?: boolean;
        marketingEnabled?: boolean;
    };
}
export interface UpdatePreferencesResult {
    success: boolean;
    userId: string;
    preferences: any;
    message: string;
}
export declare class UpdateNotificationPreferencesUseCase {
    private readonly preferencesRepository;
    constructor(preferencesRepository: IPreferencesRepository);
    execute(command: UpdatePreferencesCommand): Promise<UpdatePreferencesResult>;
}
//# sourceMappingURL=UpdateNotificationPreferencesUseCase.d.ts.map