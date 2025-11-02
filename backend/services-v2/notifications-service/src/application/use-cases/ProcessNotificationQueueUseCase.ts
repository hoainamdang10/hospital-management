/**
 * ProcessNotificationQueueUseCase - Command Use Case
 * Process pending notifications in queue
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Queue Processing
 */

import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IDeliveryService } from '../../domain/services/IDeliveryService';
import { NotificationId } from '../../domain/value-objects/NotificationId';

export interface ProcessQueueCommand {
  batchSize?: number;
  priorityFilter?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  maxProcessingTime?: number;
  onlyExpiredNotifications?: boolean;
}

export interface ProcessQueueResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  expired: number;
  remaining: number;
  processingTime: number;
  statistics: {
    byPriority: Record<string, number>;
    byChannel: Record<string, number>;
  };
  details: Array<{
    notificationId: string;
    status: 'SENT' | 'FAILED' | 'EXPIRED';
    message: string;
  }>;
}

export class ProcessNotificationQueueUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly deliveryService: IDeliveryService
  ) {}

  async execute(command: ProcessQueueCommand): Promise<ProcessQueueResult> {
    const startTime = Date.now();
    const batchSize = command.batchSize || 100;

    try {
      // Get scheduled notifications due for processing
      const notifications = await this.notificationRepository.findScheduledForProcessing(
        new Date(),
        batchSize
      );

      const details: Array<{ notificationId: string; status: 'SENT' | 'FAILED' | 'EXPIRED'; message: string }> = [];
      let successful = 0;
      let failed = 0;
      let expired = 0;

      for (const notification of notifications) {
        try {
          // Check if expired
          const expiresAt = (notification.metadata as any).expiresAt;
          if (expiresAt && new Date(expiresAt) < new Date()) {
            await this.notificationRepository.updateStatus(
              NotificationId.fromString(notification.id),
              'EXPIRED'
            );
            expired++;
            details.push({
              notificationId: notification.id,
              status: 'EXPIRED',
              message: 'Notification expired'
            });
            continue;
          }

          // Deliver notification
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
            successful++;
            details.push({
              notificationId: notification.id,
              status: 'SENT',
              message: 'Sent successfully'
            });
          } else {
            notification.markAsFailed(
              deliveryResults.map(r => ({
                channel: r.channel,
                reason: 'DELIVERY_FAILED',
                errorMessage: r.failureReason || 'Unknown error',
                retryable: r.retryable
              }))
            );
            await this.notificationRepository.update(notification);
            failed++;
            details.push({
              notificationId: notification.id,
              status: 'FAILED',
              message: 'Delivery failed'
            });
          }
        } catch (error) {
          failed++;
          details.push({
            notificationId: notification.id,
            status: 'FAILED',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const processingTime = Date.now() - startTime;
      const remaining = await this.notificationRepository.getQueueSize();

      return {
        totalProcessed: notifications.length,
        successful,
        failed,
        expired,
        remaining,
        processingTime,
        statistics: {
          byPriority: {},
          byChannel: {}
        },
        details
      };
    } catch (error) {
      throw new Error(`Failed to process queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

