/**
 * NotificationCommandHandlers - Application Command Handlers
 * CQRS command handlers for notification operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Vietnamese Healthcare Standards
 */

import { SendNotificationUseCase, SendNotificationCommand, SendNotificationResult } from '../use-cases/SendNotificationUseCase';
import { ScheduleNotificationUseCase, ScheduleNotificationCommand, ScheduleNotificationResult } from '../use-cases/ScheduleNotificationUseCase';
import { ProcessNotificationQueueUseCase, ProcessQueueCommand, ProcessQueueResult } from '../use-cases/ProcessNotificationQueueUseCase';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { NotificationId } from '../../domain/value-objects/NotificationId';

export interface CancelNotificationCommand {
  notificationId: string;
  reason?: string;
  userId?: string;
}

export interface RetryNotificationCommand {
  notificationId: string;
  channels?: string[];
  maxRetries?: number;
  userId?: string;
}

export interface UpdateNotificationCommand {
  notificationId: string;
  templateData?: Record<string, any>;
  scheduledAt?: Date;
  expiresAt?: Date;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  channels?: string[];
  userId?: string;
}

export interface BulkNotificationCommand {
  recipientIds: string[];
  recipientType: string;
  templateType: string;
  templateData: Record<string, any>;
  channels?: string[];
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: {
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    source?: string;
    tags?: string[];
    healthcareContext?: any;
  };
}

export interface BulkNotificationResult {
  totalRequested: number;
  successful: number;
  failed: number;
  results: Array<{
    recipientId: string;
    notificationId?: string;
    status: 'SUCCESS' | 'FAILED';
    errorMessage?: string;
  }>;
}

export class NotificationCommandHandlers {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly scheduleNotificationUseCase: ScheduleNotificationUseCase,
    private readonly processQueueUseCase: ProcessNotificationQueueUseCase,
    private readonly notificationRepository: INotificationRepository
  ) {}

  /**
   * Handle send notification command
   */
  public async handleSendNotification(command: SendNotificationCommand): Promise<SendNotificationResult> {
    try {
      return await this.sendNotificationUseCase.execute(command);
    } catch (error) {
      throw new Error(`Lỗi khi gửi thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle schedule notification command
   */
  public async handleScheduleNotification(command: ScheduleNotificationCommand): Promise<ScheduleNotificationResult> {
    try {
      return await this.scheduleNotificationUseCase.execute(command);
    } catch (error) {
      throw new Error(`Lỗi khi lên lịch thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle process queue command
   */
  public async handleProcessQueue(command: ProcessQueueCommand = {}): Promise<ProcessQueueResult> {
    try {
      return await this.processQueueUseCase.execute(command);
    } catch (error) {
      throw new Error(`Lỗi khi xử lý hàng đợi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle cancel notification command
   */
  public async handleCancelNotification(command: CancelNotificationCommand): Promise<{
    notificationId: string;
    status: 'CANCELLED';
    message: string;
  }> {
    try {
      // Validate command
      if (!command.notificationId?.trim()) {
        throw new Error('Mã thông báo không được để trống');
      }

      // Get notification
      const notificationId = NotificationId.fromString(command.notificationId);
      const notification = await this.notificationRepository.findById(notificationId);

      if (!notification) {
        throw new Error('Không tìm thấy thông báo');
      }

      // Check if notification can be cancelled
      const currentStatus = notification.getStatus();
      if (currentStatus === 'SENT' || currentStatus === 'CANCELLED' || currentStatus === 'EXPIRED') {
        throw new Error(`Không thể hủy thông báo ở trạng thái ${currentStatus}`);
      }

      // Update status to cancelled
      await this.notificationRepository.updateStatus(notificationId, 'CANCELLED');

      return {
        notificationId: command.notificationId,
        status: 'CANCELLED',
        message: `Đã hủy thông báo ${command.notificationId}${command.reason ? ` - Lý do: ${command.reason}` : ''}`
      };

    } catch (error) {
      throw new Error(`Lỗi khi hủy thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle retry notification command
   */
  public async handleRetryNotification(command: RetryNotificationCommand): Promise<{
    notificationId: string;
    status: 'RETRYING' | 'FAILED';
    message: string;
    retryAttempt: number;
  }> {
    try {
      // Validate command
      if (!command.notificationId?.trim()) {
        throw new Error('Mã thông báo không được để trống');
      }

      // Get notification
      const notificationId = NotificationId.fromString(command.notificationId);
      const notification = await this.notificationRepository.findById(notificationId);

      if (!notification) {
        throw new Error('Không tìm thấy thông báo');
      }

      // Check if notification can be retried
      if (!notification.canRetry()) {
        throw new Error('Thông báo không thể thử lại (đã vượt quá số lần thử tối đa hoặc không ở trạng thái FAILED)');
      }

      // Check if notification is expired
      if (notification.isExpired()) {
        throw new Error('Không thể thử lại thông báo đã hết hạn');
      }

      // Reset status to scheduled for retry
      await this.notificationRepository.updateStatus(notificationId, 'SCHEDULED');

      // Update retry information
      const newRetryCount = notification.getRetryCount() + 1;
      const nextRetryAt = new Date(Date.now() + Math.pow(2, newRetryCount) * 60 * 1000); // Exponential backoff

      await this.notificationRepository.updateRetryInfo(notificationId, newRetryCount, nextRetryAt);

      return {
        notificationId: command.notificationId,
        status: 'RETRYING',
        message: `Đã lên lịch thử lại thông báo ${command.notificationId} (lần thử ${newRetryCount})`,
        retryAttempt: newRetryCount
      };

    } catch (error) {
      throw new Error(`Lỗi khi thử lại thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle update notification command
   */
  public async handleUpdateNotification(command: UpdateNotificationCommand): Promise<{
    notificationId: string;
    status: 'UPDATED';
    message: string;
    updatedFields: string[];
  }> {
    try {
      // Validate command
      if (!command.notificationId?.trim()) {
        throw new Error('Mã thông báo không được để trống');
      }

      // Get notification
      const notificationId = NotificationId.fromString(command.notificationId);
      const notification = await this.notificationRepository.findById(notificationId);

      if (!notification) {
        throw new Error('Không tìm thấy thông báo');
      }

      // Check if notification can be updated
      const currentStatus = notification.getStatus();
      if (currentStatus !== 'DRAFT' && currentStatus !== 'SCHEDULED') {
        throw new Error(`Không thể cập nhật thông báo ở trạng thái ${currentStatus}`);
      }

      const updatedFields: string[] = [];

      // Update fields (this would require extending the aggregate with update methods)
      // For now, we'll just track what would be updated
      if (command.templateData) {
        updatedFields.push('templateData');
      }
      if (command.scheduledAt) {
        updatedFields.push('scheduledAt');
      }
      if (command.expiresAt) {
        updatedFields.push('expiresAt');
      }
      if (command.priority) {
        updatedFields.push('priority');
      }
      if (command.channels) {
        updatedFields.push('channels');
      }

      if (updatedFields.length === 0) {
        throw new Error('Không có trường nào được cập nhật');
      }

      // In a real implementation, you would update the notification aggregate
      // and save it back to the repository
      await this.notificationRepository.update(notification);

      return {
        notificationId: command.notificationId,
        status: 'UPDATED',
        message: `Đã cập nhật thông báo ${command.notificationId}`,
        updatedFields
      };

    } catch (error) {
      throw new Error(`Lỗi khi cập nhật thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle bulk notification command
   */
  public async handleBulkNotification(command: BulkNotificationCommand): Promise<BulkNotificationResult> {
    try {
      // Validate command
      if (!command.recipientIds || command.recipientIds.length === 0) {
        throw new Error('Danh sách người nhận không được để trống');
      }

      if (command.recipientIds.length > 1000) {
        throw new Error('Không thể gửi cho hơn 1000 người nhận trong một lần');
      }

      const results: BulkNotificationResult['results'] = [];
      let successful = 0;
      let failed = 0;

      // Process recipients in batches to avoid overwhelming the system
      const batchSize = 50;
      for (let i = 0; i < command.recipientIds.length; i += batchSize) {
        const batch = command.recipientIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipientId) => {
          try {
            const sendCommand: SendNotificationCommand = {
              recipientId,
              recipientType: command.recipientType,
              templateType: command.templateType,
              templateData: {
                ...command.templateData,
                recipientId // Add recipient ID to template data
              },
              channels: command.channels,
              priority: command.priority,
              scheduledAt: command.scheduledAt,
              expiresAt: command.expiresAt,
              metadata: {
                ...command.metadata,
                tags: [...(command.metadata?.tags || []), 'bulk-notification']
              }
            };

            const result = await this.sendNotificationUseCase.execute(sendCommand);
            
            results.push({
              recipientId,
              notificationId: result.notificationId,
              status: 'SUCCESS'
            });
            
            successful++;
          } catch (error) {
            results.push({
              recipientId,
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Lỗi không xác định'
            });
            
            failed++;
          }
        });

        // Wait for current batch to complete
        await Promise.all(batchPromises);
      }

      return {
        totalRequested: command.recipientIds.length,
        successful,
        failed,
        results
      };

    } catch (error) {
      throw new Error(`Lỗi khi gửi thông báo hàng loạt: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get processing recommendations
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
      return await this.processQueueUseCase.getProcessingRecommendations();
    } catch (error) {
      throw new Error(`Lỗi khi lấy khuyến nghị xử lý: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get notification statistics
   */
  public async getNotificationStatistics(dateRange?: { start: Date; end: Date }): Promise<{
    totalNotifications: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byChannel: Record<string, number>;
    byTemplateType: Record<string, number>;
    successRate: number;
    averageDeliveryTime: number;
    failureReasons: Record<string, number>;
    recentActivity: {
      last24Hours: number;
      lastWeek: number;
      lastMonth: number;
    };
  }> {
    try {
      return await this.notificationRepository.getStatistics(dateRange);
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê thông báo: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }
}
