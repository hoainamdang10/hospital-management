/**
 * ProcessNotificationQueueUseCase - Application Use Case
 * Use case for processing scheduled notifications queue
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Vietnamese Healthcare Standards
 */

import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IDeliveryService } from '../../domain/services/IDeliveryService';
import { NotificationAggregate } from '../../domain/aggregates/NotificationAggregate';

export interface ProcessQueueCommand {
  batchSize?: number;
  priorityFilter?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  maxProcessingTime?: number; // in milliseconds
  onlyExpiredNotifications?: boolean;
}

export interface ProcessQueueResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  expired: number;
  remaining: number;
  processingTime: number;
  details: Array<{
    notificationId: string;
    status: 'SUCCESS' | 'FAILED' | 'EXPIRED';
    channels: string[];
    deliveryTime?: number;
    errorMessage?: string;
  }>;
  statistics: {
    byPriority: Record<string, number>;
    byChannel: Record<string, number>;
    byStatus: Record<string, number>;
    averageDeliveryTime: number;
  };
}

export class ProcessNotificationQueueUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly deliveryService: IDeliveryService
  ) {}

  /**
   * Execute process notification queue use case
   */
  public async execute(command: ProcessQueueCommand = {}): Promise<ProcessQueueResult> {
    const startTime = Date.now();
    const batchSize = command.batchSize || 50;
    const maxProcessingTime = command.maxProcessingTime || 300000; // 5 minutes default
    
    try {
      // Get scheduled notifications ready for processing
      const scheduledNotifications = await this.getScheduledNotifications(command, batchSize);

      if (scheduledNotifications.length === 0) {
        return this.createEmptyResult(startTime);
      }

      // Process notifications in batches
      const results = await this.processNotificationBatch(
        scheduledNotifications,
        maxProcessingTime,
        startTime
      );

      // Get remaining queue size
      const remaining = await this.notificationRepository.getQueueSize();

      // Calculate statistics
      const statistics = this.calculateStatistics(results.details);

      return {
        ...results,
        remaining,
        processingTime: Date.now() - startTime,
        statistics
      };

    } catch (error) {
      throw new Error(`Lỗi khi xử lý hàng đợi thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get scheduled notifications ready for processing
   */
  private async getScheduledNotifications(
    command: ProcessQueueCommand,
    batchSize: number
  ): Promise<NotificationAggregate[]> {
    const now = new Date();
    
    if (command.onlyExpiredNotifications) {
      // Get expired notifications for cleanup
      return await this.notificationRepository.findOverdueNotifications(3600000); // 1 hour overdue
    }

    // Get notifications scheduled for processing
    let notifications = await this.notificationRepository.findScheduledForProcessing(now, batchSize * 2);

    // Filter by priority if specified
    if (command.priorityFilter) {
      notifications = notifications.filter(n => n.getPriority() === command.priorityFilter);
    }

    // Sort by priority and scheduled time
    notifications.sort((a, b) => {
      // Priority order: URGENT > HIGH > NORMAL > LOW
      const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'NORMAL': 2, 'LOW': 1 };
      const aPriority = priorityOrder[a.getPriority()];
      const bPriority = priorityOrder[b.getPriority()];

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      // Same priority, sort by scheduled time
      return a.getScheduledAt().getTime() - b.getScheduledAt().getTime();
    });

    // Return only the batch size
    return notifications.slice(0, batchSize);
  }

  /**
   * Process batch of notifications
   */
  private async processNotificationBatch(
    notifications: NotificationAggregate[],
    maxProcessingTime: number,
    startTime: number
  ): Promise<{
    totalProcessed: number;
    successful: number;
    failed: number;
    expired: number;
    details: Array<{
      notificationId: string;
      status: 'SUCCESS' | 'FAILED' | 'EXPIRED';
      channels: string[];
      deliveryTime?: number;
      errorMessage?: string;
    }>;
  }> {
    const results = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      expired: 0,
      details: [] as Array<{
        notificationId: string;
        status: 'SUCCESS' | 'FAILED' | 'EXPIRED';
        channels: string[];
        deliveryTime?: number;
        errorMessage?: string;
      }>
    };

    // Process notifications concurrently but with controlled concurrency
    const concurrencyLimit = 10;
    const processingPromises: Promise<void>[] = [];

    for (let i = 0; i < notifications.length; i += concurrencyLimit) {
      // Check if we're running out of time
      if (Date.now() - startTime > maxProcessingTime * 0.9) {
        console.log(`Stopping processing due to time limit. Processed ${results.totalProcessed} notifications.`);
        break;
      }

      const batch = notifications.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(notification => 
        this.processNotification(notification).then(result => {
          results.totalProcessed++;
          results.details.push(result);
          
          switch (result.status) {
            case 'SUCCESS':
              results.successful++;
              break;
            case 'FAILED':
              results.failed++;
              break;
            case 'EXPIRED':
              results.expired++;
              break;
          }
        }).catch(error => {
          results.totalProcessed++;
          results.failed++;
          results.details.push({
            notificationId: notification.getId().getValue(),
            status: 'FAILED',
            channels: notification.getChannels().map(c => c.getType()),
            errorMessage: error instanceof Error ? error.message : 'Lỗi không xác định'
          });
        })
      );

      processingPromises.push(...batchPromises);
      
      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);
    }

    // Wait for all processing to complete
    await Promise.all(processingPromises);

    return results;
  }

  /**
   * Process single notification
   */
  private async processNotification(notification: NotificationAggregate): Promise<{
    notificationId: string;
    status: 'SUCCESS' | 'FAILED' | 'EXPIRED';
    channels: string[];
    deliveryTime?: number;
    errorMessage?: string;
  }> {
    const notificationId = notification.getId().getValue();
    const channels = notification.getChannels().map(c => c.getType());
    const processStartTime = Date.now();

    try {
      // Check if notification is expired
      if (notification.isExpired()) {
        await this.handleExpiredNotification(notification);
        return {
          notificationId,
          status: 'EXPIRED',
          channels,
          errorMessage: 'Thông báo đã hết hạn'
        };
      }

      // Check if notification is ready for processing
      if (!notification.isReadyForProcessing()) {
        return {
          notificationId,
          status: 'FAILED',
          channels,
          errorMessage: 'Thông báo chưa sẵn sàng để xử lý'
        };
      }

      // Start processing
      notification.startProcessing();
      await this.notificationRepository.update(notification);

      // Create delivery request
      const deliveryRequest = {
        notificationId,
        recipient: notification.getRecipient(),
        content: notification.getContent(),
        channels: notification.getChannels(),
        priority: notification.getPriority(),
        metadata: {
          correlationId: notification.getMetadata().correlationId,
          userId: notification.getMetadata().userId,
          sessionId: notification.getMetadata().sessionId,
          healthcareContext: notification.getMetadata().healthcareContext
        }
      };

      // Deliver notification
      const deliveryResults = await this.deliveryService.deliver(deliveryRequest);

      // Update notification with results
      notification.markAsSent(deliveryResults);
      await this.notificationRepository.update(notification);

      const deliveryTime = Date.now() - processStartTime;
      const hasSuccessfulDelivery = deliveryResults.some(r => 
        r.status === 'SENT' || r.status === 'DELIVERED'
      );

      return {
        notificationId,
        status: hasSuccessfulDelivery ? 'SUCCESS' : 'FAILED',
        channels,
        deliveryTime,
        errorMessage: hasSuccessfulDelivery ? undefined : 'Gửi thất bại trên tất cả các kênh'
      };

    } catch (error) {
      // Handle delivery failure
      const channelFailures = channels.map(channel => ({
        channel,
        reason: 'UNKNOWN_ERROR' as const,
        errorMessage: error instanceof Error ? error.message : 'Lỗi không xác định',
        attemptedAt: new Date(),
        retryable: true
      }));

      notification.markAsFailed(channelFailures);
      await this.notificationRepository.update(notification);

      return {
        notificationId,
        status: 'FAILED',
        channels,
        deliveryTime: Date.now() - processStartTime,
        errorMessage: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
    }
  }

  /**
   * Handle expired notification
   */
  private async handleExpiredNotification(notification: NotificationAggregate): Promise<void> {
    // Mark as expired and save
    await this.notificationRepository.updateStatus(notification.getId(), 'EXPIRED');
  }

  /**
   * Calculate processing statistics
   */
  private calculateStatistics(details: Array<{
    notificationId: string;
    status: 'SUCCESS' | 'FAILED' | 'EXPIRED';
    channels: string[];
    deliveryTime?: number;
    errorMessage?: string;
  }>): {
    byPriority: Record<string, number>;
    byChannel: Record<string, number>;
    byStatus: Record<string, number>;
    averageDeliveryTime: number;
  } {
    const byStatus: Record<string, number> = {
      SUCCESS: 0,
      FAILED: 0,
      EXPIRED: 0
    };

    const byChannel: Record<string, number> = {};
    const deliveryTimes: number[] = [];

    details.forEach(detail => {
      // Count by status
      byStatus[detail.status]++;

      // Count by channel
      detail.channels.forEach(channel => {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      });

      // Collect delivery times
      if (detail.deliveryTime) {
        deliveryTimes.push(detail.deliveryTime);
      }
    });

    // Calculate average delivery time
    const averageDeliveryTime = deliveryTimes.length > 0
      ? Math.round(deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length)
      : 0;

    return {
      byPriority: {}, // Would need notification priority data to calculate this
      byChannel,
      byStatus,
      averageDeliveryTime
    };
  }

  /**
   * Create empty result when no notifications to process
   */
  private createEmptyResult(startTime: number): ProcessQueueResult {
    return {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      expired: 0,
      remaining: 0,
      processingTime: Date.now() - startTime,
      details: [],
      statistics: {
        byPriority: {},
        byChannel: {},
        byStatus: {},
        averageDeliveryTime: 0
      }
    };
  }

  /**
   * Get queue processing recommendations
   */
  public async getProcessingRecommendations(): Promise<{
    recommendedBatchSize: number;
    estimatedProcessingTime: number;
    priorityDistribution: Record<string, number>;
    urgentNotifications: number;
    overdueNotifications: number;
    recommendations: string[];
  }> {
    try {
      // Get queue statistics
      const totalQueued = await this.notificationRepository.getQueueSize();
      const urgentQueued = await this.notificationRepository.getQueueSize('URGENT');
      const overdueNotifications = await this.notificationRepository.findOverdueNotifications(3600000); // 1 hour

      // Get average processing time
      const averageProcessingTime = await this.notificationRepository.getAverageProcessingTime();

      // Calculate recommendations
      const recommendations: string[] = [];
      let recommendedBatchSize = 50;

      if (urgentQueued > 10) {
        recommendations.push('Có nhiều thông báo khẩn cấp cần xử lý ưu tiên');
        recommendedBatchSize = Math.min(100, urgentQueued);
      }

      if (overdueNotifications.length > 0) {
        recommendations.push(`Có ${overdueNotifications.length} thông báo quá hạn cần xử lý`);
      }

      if (totalQueued > 1000) {
        recommendations.push('Hàng đợi đang quá tải, cần tăng tần suất xử lý');
        recommendedBatchSize = 100;
      }

      if (averageProcessingTime > 10000) { // 10 seconds
        recommendations.push('Thời gian xử lý trung bình cao, cần kiểm tra hiệu suất');
      }

      const estimatedProcessingTime = Math.ceil((totalQueued / recommendedBatchSize) * averageProcessingTime);

      return {
        recommendedBatchSize,
        estimatedProcessingTime,
        priorityDistribution: {
          URGENT: urgentQueued,
          HIGH: await this.notificationRepository.getQueueSize('HIGH'),
          NORMAL: await this.notificationRepository.getQueueSize('NORMAL'),
          LOW: await this.notificationRepository.getQueueSize('LOW')
        },
        urgentNotifications: urgentQueued,
        overdueNotifications: overdueNotifications.length,
        recommendations
      };

    } catch (error) {
      throw new Error(`Lỗi khi lấy khuyến nghị xử lý: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }
}
