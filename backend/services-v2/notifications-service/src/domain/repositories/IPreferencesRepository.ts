/**
 * Preferences Repository Interface
 * Handles user notification preferences
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @status STUB - To be implemented
 */

export interface NotificationPreferences {
  userId: string;
  email?: string;
  phone?: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  quiet: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
  };
}

export interface IPreferencesRepository {
  /**
   * Get user notification preferences
   */
  getByUserId(userId: string): Promise<NotificationPreferences | null>;

  /**
   * Update user notification preferences
   */
  update(userId: string, preferences: Partial<NotificationPreferences>): Promise<void>;

  /**
   * Create default preferences for new user
   */
  createDefault(userId: string, email?: string, phone?: string): Promise<NotificationPreferences>;
}
