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

export class UpdateNotificationPreferencesUseCase {
  constructor(
    private readonly preferencesRepository: IPreferencesRepository
  ) {}

  async execute(command: UpdatePreferencesCommand): Promise<UpdatePreferencesResult> {
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
    } catch (error) {
      throw new Error(
        `Failed to update notification preferences: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
