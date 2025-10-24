/**
 * NotificationApplicationService - Simplified Application Service
 * Orchestrates notification sending operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Scheduler Integration
 */

import { SendNotificationUseCase, SendNotificationCommand, SendNotificationResult } from '../use-cases/SendNotificationUseCase';

export class NotificationApplicationService {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {}

  /**
   * Send notification immediately
   * Called by Scheduler Service or other services
   */
  async sendNotification(command: SendNotificationCommand): Promise<SendNotificationResult> {
    return await this.sendNotificationUseCase.execute(command);
  }
}
