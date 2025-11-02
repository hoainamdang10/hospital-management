/**
 * CancelNotificationUseCase - Command Use Case
 * Cancel scheduled or pending notification
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command
 */

import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { NotificationId } from '../../domain/value-objects/NotificationId';

export interface CancelNotificationCommand {
  notificationId: string;
  reason?: string;
  userId?: string;
}

export interface CancelNotificationResult {
  notificationId: string;
  status: string;
  message: string;
}

export class CancelNotificationUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(command: CancelNotificationCommand): Promise<CancelNotificationResult> {
    try {
      const notificationId = NotificationId.fromString(command.notificationId);
      const notification = await this.notificationRepository.findById(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Update status to CANCELLED
      await this.notificationRepository.updateStatus(notificationId, 'CANCELLED');

      return {
        notificationId: command.notificationId,
        status: 'CANCELLED',
        message: 'Notification cancelled successfully'
      };
    } catch (error) {
      throw new Error(`Failed to cancel notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

