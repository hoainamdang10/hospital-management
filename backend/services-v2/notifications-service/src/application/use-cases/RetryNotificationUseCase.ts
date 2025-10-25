/**
 * RetryNotificationUseCase - Command Use Case
 * Retry failed notification delivery
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Command
 */

import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IDeliveryService } from '../../domain/services/IDeliveryService';
import { NotificationId } from '../../domain/value-objects/NotificationId';

export interface RetryNotificationCommand {
  notificationId: string;
  channels?: string[]; // Specific channels to retry, or all failed channels
  userId?: string;
}

export interface RetryNotificationResult {
  notificationId: string;
  status: string;
  retryAttempt: number;
  deliveryResults: any[];
  message: string;
}

export class RetryNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly deliveryService: IDeliveryService
  ) {}

  async execute(command: RetryNotificationCommand): Promise<RetryNotificationResult> {
    try {
      const notificationId = new NotificationId(command.notificationId);
      const notification = await this.notificationRepository.findById(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.status !== 'FAILED') {
        throw new Error('Can only retry failed notifications');
      }

      // Retry delivery
      const deliveryResults = await this.deliveryService.deliver({
        notificationId: notification.id,
        recipient: notification.recipient,
        content: notification.content,
        channels: notification.channels,
        priority: notification.priority,
        metadata: notification.metadata
      });

      const hasSuccess = deliveryResults.some(r => r.success);

      if (hasSuccess) {
        notification.markAsSent(deliveryResults);
        await this.notificationRepository.update(notification);

        return {
          notificationId: command.notificationId,
          status: 'SENT',
          retryAttempt: 1,
          deliveryResults,
          message: 'Notification retry successful'
        };
      } else {
        notification.markAsFailed(
          deliveryResults.map(r => ({
            channel: r.channel,
            reason: 'RETRY_FAILED',
            errorMessage: r.providerResponse?.error || 'Retry failed',
            retryable: true
          }))
        );
        await this.notificationRepository.update(notification);

        return {
          notificationId: command.notificationId,
          status: 'FAILED',
          retryAttempt: 1,
          deliveryResults,
          message: 'Notification retry failed'
        };
      }
    } catch (error) {
      throw new Error(`Failed to retry notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

