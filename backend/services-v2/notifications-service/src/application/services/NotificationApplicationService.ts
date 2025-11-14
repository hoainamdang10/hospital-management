/**
 * NotificationApplicationService - Simplified for Demo
 * Orchestrates core notification operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, Demo Implementation
 */

import { SendNotificationUseCase, SendNotificationCommand, SendNotificationResult } from '../use-cases/SendNotificationUseCase';
import { GetNotificationUseCase } from '../use-cases/GetNotificationUseCase';
import { GetNotificationPreferencesUseCase } from '../use-cases/GetNotificationPreferencesUseCase';

export class NotificationApplicationService {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getNotificationUseCase: GetNotificationUseCase,
    private readonly getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase
  ) {}

  // ==================== Notification Operations ====================

  /**
   * Send notification immediately
   */
  async sendNotification(command: SendNotificationCommand): Promise<SendNotificationResult> {
    const deliveryResults = await this.sendNotificationUseCase.execute(command);
    
    return {
      notificationId: 'temp-id', // Will be updated when we have proper notification ID
      status: deliveryResults.some(r => r.success) ? "SENT" : "FAILED",
      deliveryResults,
      sentAt: new Date(),
      message: deliveryResults.some(r => r.success) ? 'Đã gửi thông báo thành công' : 'Gửi thông báo thất bại'
    };
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string) {
    return await this.getNotificationUseCase.execute({ notificationId });
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(userId: string, userType?: 'patient' | 'staff') {
    return await this.getNotificationPreferencesUseCase.execute({ 
      userId, 
      userType 
    });
  }
}
