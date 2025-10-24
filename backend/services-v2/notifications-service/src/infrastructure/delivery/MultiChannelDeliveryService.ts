/**
 * MultiChannelDeliveryService - Infrastructure Delivery Service
 * Multi-channel notification delivery service with Vietnamese healthcare optimization
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */

import { IDeliveryService, DeliveryRequest, DeliveryResult } from '../../domain/services/IDeliveryService';
import { NotificationChannel } from '../../domain/value-objects/NotificationChannel';
import { RecipientInfo } from '../../domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../domain/value-objects/NotificationContent';

export interface ChannelProvider {
  getType(): string;
  isAvailable(): Promise<boolean>;
  deliver(request: {
    recipient: RecipientInfo;
    content: NotificationContent;
    channel: NotificationChannel;
    metadata?: any;
  }): Promise<{
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
    messageId?: string;
    deliveredAt?: Date;
    failureReason?: string;
    providerResponse?: any;
  }>;
  getDeliveryStatus(messageId: string): Promise<{
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
    deliveredAt?: Date;
    failureReason?: string;
  }>;
}

export class MultiChannelDeliveryService implements IDeliveryService {
  private readonly providers: Map<string, ChannelProvider> = new Map();
  private readonly deliveryHistory: Map<string, DeliveryResult[]> = new Map();

  constructor(providers: ChannelProvider[] = []) {
    providers.forEach(provider => {
      this.providers.set(provider.getType(), provider);
    });
  }

  /**
   * Register channel provider
   */
  public registerProvider(provider: ChannelProvider): void {
    this.providers.set(provider.getType(), provider);
  }

  /**
   * Deliver notification through multiple channels
   */
  public async deliver(request: DeliveryRequest): Promise<DeliveryResult[]> {
    try {
      const results: DeliveryResult[] = [];
      const deliveryPromises: Promise<DeliveryResult>[] = [];

      // Process each channel
      for (const channel of request.channels) {
        const channelType = channel.getType();
        const provider = this.providers.get(channelType);

        if (!provider) {
          results.push({
            notificationId: request.notificationId,
            channel: channelType,
            success: false,
            status: 'FAILED',
            failureReason: `Không tìm thấy provider cho kênh ${channelType}`,
            deliveryTime: 0,
            retryable: false
          });
          continue;
        }

        // Check if provider is available
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          results.push({
            notificationId: request.notificationId,
            channel: channelType,
            success: false,
            status: 'FAILED',
            failureReason: `Provider ${channelType} không khả dụng`,
            deliveryTime: 0,
            retryable: true
          });
          continue;
        }

        // Create delivery promise
        const deliveryPromise = this.deliverToChannel(
          request.notificationId,
          request.recipient,
          request.content,
          channel
        );

        deliveryPromises.push(deliveryPromise);
      }

      // Wait for all deliveries to complete
      const channelResults = await Promise.allSettled(deliveryPromises);

      // Process results
      channelResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const channelType = request.channels[index]?.getType() || 'UNKNOWN';
          results.push({
            notificationId: request.notificationId,
            channel: channelType,
            success: false,
            status: 'FAILED',
            failureReason: `Lỗi delivery: ${result.reason?.message || 'Lỗi không xác định'}`,
            deliveryTime: 0,
            retryable: true
          });
        }
      });

      // Store delivery history
      this.deliveryHistory.set(request.notificationId, results);

      return results;

    } catch (error) {
      throw new Error(`Lỗi delivery service: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Deliver to single channel
   */
  async deliverToChannel(
    notificationId: string,
    recipient: RecipientInfo,
    content: NotificationContent,
    channel: NotificationChannel
  ): Promise<DeliveryResult> {
    const startTime = Date.now();
    const channelType = channel.getType();
    const provider = this.providers.get(channelType);

    if (!provider) {
      return {
        notificationId,
        channel: channelType,
        success: false,
        status: 'FAILED',
        failureReason: `Không tìm thấy provider cho kênh ${channelType}`,
        deliveryTime: 0,
        retryable: false
      };
    }

    try {
      // Validate content for channel
      const contentValidation = content.validateForChannel(channelType);
      if (!contentValidation.valid) {
        return {
          notificationId,
          channel: channelType,
          success: false,
          status: 'FAILED',
          failureReason: `Nội dung không hợp lệ cho kênh ${channelType}: ${contentValidation.errors.join(', ')}`,
          deliveryTime: 0,
          retryable: false
        };
      }

      // Check recipient preferences
      if (!this.shouldDeliverToChannel(recipient, channel)) {
        return {
          notificationId,
          channel: channelType,
          success: false,
          status: 'FAILED',
          failureReason: 'Người nhận đã tắt thông báo cho kênh này',
          deliveryTime: 0,
          retryable: false
        };
      }

      // Check quiet hours
      if (recipient.isInQuietHours()) {
        return {
          notificationId,
          channel: channelType,
          success: false,
          status: 'FAILED',
          failureReason: 'Trong giờ nghỉ của người nhận',
          deliveryTime: 0,
          retryable: true
        };
      }

      // Attempt delivery
      const deliveryResult = await provider.deliver({
        recipient,
        content,
        channel,
        metadata: { notificationId }
      });
      const deliveryTime = Date.now() - startTime;

      return {
        notificationId,
        channel: channelType,
        success: deliveryResult.status === 'SENT' || deliveryResult.status === 'DELIVERED',
        status: deliveryResult.status as any,
        deliveredAt: deliveryResult.deliveredAt,
        failureReason: deliveryResult.failureReason,
        deliveryTime,
        retryable: deliveryResult.status === 'FAILED' && this.isRetryableFailure(deliveryResult.failureReason),
        providerResponse: deliveryResult.providerResponse
      };

    } catch (error) {
      const deliveryTime = Date.now() - startTime;

      return {
        notificationId,
        channel: channelType,
        success: false,
        status: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'Lỗi không xác định',
        deliveryTime,
        retryable: true
      };
    }
  }

  /**
   * Check if should deliver to channel based on recipient preferences
   */
  private shouldDeliverToChannel(recipient: RecipientInfo, channel: NotificationChannel): boolean {
    const preferences = recipient.getPreferences();

    // Check if channel is enabled
    if (!preferences.preferredChannels.includes(channel.getType())) {
      return false;
    }

    // Check if recipient has opted out (marketing/reminders)
    if (preferences.optOut.marketing || preferences.optOut.reminders) {
      return false;
    }

    return true;
  }

  /**
   * Check if failure is retryable
   */
  private isRetryableFailure(failureReason?: string): boolean {
    if (!failureReason) return true;

    const nonRetryableReasons = [
      'invalid phone number',
      'invalid email address',
      'recipient opted out',
      'content validation failed',
      'trong giờ nghỉ',
      'đã tắt thông báo'
    ];

    return !nonRetryableReasons.some(reason => 
      failureReason.toLowerCase().includes(reason.toLowerCase())
    );
  }

  /**
   * Get delivery status for notification
   */
  public async getDeliveryStatus(notificationId: string): Promise<DeliveryResult[]> {
    try {
      const cachedResults = this.deliveryHistory.get(notificationId);
      if (!cachedResults) {
        return [];
      }

      // Update status from providers for messages that might have been delivered
      const updatedResults: DeliveryResult[] = [];

      for (const result of cachedResults) {
        if (result.status === 'SENT' && result.providerId) {
          const provider = this.providers.get(result.channel);
          if (provider && result.providerId) {
            try {
              const status = await provider.getDeliveryStatus(result.providerId);
              updatedResults.push({
                ...result,
                status: status.status as any,
                deliveredAt: status.deliveredAt || result.deliveredAt,
                failureReason: status.failureReason || result.failureReason
              });
            } catch (error) {
              // If status check fails, keep original result
              updatedResults.push(result);
            }
          } else {
            updatedResults.push(result);
          }
        } else {
          updatedResults.push(result);
        }
      }

      // Update cache
      this.deliveryHistory.set(notificationId, updatedResults);

      return updatedResults;

    } catch (error) {
      throw new Error(`Lỗi khi lấy trạng thái delivery: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Get delivery analytics (STUB - Not implemented yet)
   */
  public async getDeliveryAnalytics(_dateRange: { start: Date; end: Date }): Promise<any> {
    // TODO: Implement analytics when needed
    return {
      deliveryTrends: [],
      channelPerformance: {},
      peakHours: {},
      failureReasons: {},
      recipientEngagement: {
        deliveryRate: 0
      }
    };
  }

  /**
   * Get available channels
   */
  public getAvailableChannels(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check provider health
   */
  public async checkProviderHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [channelType, provider] of this.providers) {
      try {
        health[channelType] = await provider.isAvailable();
      } catch (error) {
        health[channelType] = false;
      }
    }

    return health;
  }

  // ==================== STUB METHODS (Not Implemented Yet) ====================

  async scheduleDelivery(_request: DeliveryRequest): Promise<string> {
    throw new Error('scheduleDelivery not implemented - use Scheduler Service instead');
  }

  async cancelScheduledDelivery(_scheduleId: string): Promise<boolean> {
    throw new Error('cancelScheduledDelivery not implemented - use Scheduler Service instead');
  }

  async retryDelivery(_notificationId: string, _failedChannels: string[], _maxRetries?: number): Promise<DeliveryResult[]> {
    throw new Error('retryDelivery not implemented yet');
  }

  async getDeliveryAttempts(_notificationId: string): Promise<any[]> {
    return [];
  }

  async canDeliverToRecipient(_recipient: RecipientInfo, _channels: NotificationChannel[], _currentTime?: Date): Promise<any> {
    return { canDeliver: true, availableChannels: [], blockedChannels: [], reasons: {} };
  }

  async validateDeliveryRequest(_request: DeliveryRequest): Promise<any> {
    return { isValid: true, errors: [], warnings: [] };
  }

  async getOptimalChannels(_recipient: RecipientInfo, _priority: any, _contentType?: string): Promise<NotificationChannel[]> {
    return [];
  }

  async getChannelHealth(_channel?: string): Promise<any[]> {
    return [];
  }

  async getDeliveryMetrics(_dateRange?: any, _filters?: any): Promise<any> {
    return { totalDeliveries: 0, successfulDeliveries: 0, failedDeliveries: 0, successRate: 0, averageDeliveryTime: 0, deliveriesByChannel: {}, deliveriesByStatus: {}, costByChannel: {}, totalCost: 0 };
  }

  async getQueueStatus(): Promise<any> {
    return { totalQueued: 0, queuedByPriority: {}, queuedByChannel: {}, averageWaitTime: 0 };
  }

  async processQueue(_batchSize?: number): Promise<any> {
    return { processed: 0, successful: 0, failed: 0, remaining: 0 };
  }

  async pauseChannel(_channel: string, _reason?: string): Promise<void> {}
  async resumeChannel(_channel: string): Promise<void> {}
  async getPausedChannels(): Promise<any[]> { return []; }
  async setChannelRateLimit(_channel: string, _maxRequests: number, _windowMs: number): Promise<void> {}
  async getRateLimitStatus(_channel: string): Promise<any> { return { maxRequests: 0, windowMs: 0, remaining: 0, resetAt: new Date() }; }
  async testChannel(_channel: string): Promise<any> { return { isHealthy: true, responseTime: 0 }; }
  async estimateDeliveryCost(_channels: string[], _recipientCount: number, _contentLength?: number): Promise<any> { return { totalCost: 0, costByChannel: {}, currency: 'VND' }; }
  async getFailedDeliveriesRequiringAttention(): Promise<any[]> { return []; }
  async bulkDeliver(_requests: DeliveryRequest[]): Promise<DeliveryResult[]> { return []; }
  async getChannelTemplates(_channel: string): Promise<any[]> { return []; }
  async configureChannelProvider(_channel: string, _providerConfig: Record<string, any>): Promise<void> {}
  async getChannelProviderConfig(_channel: string): Promise<Record<string, any>> { return {}; }
  async switchChannelProvider(_channel: string, _newProvider: string, _config: Record<string, any>): Promise<void> {}
  async getAvailableProviders(_channel: string): Promise<any[]> { return []; }
  async monitorPerformance(): Promise<any> { return { overallHealth: 'HEALTHY', channelHealth: {}, alerts: [], recommendations: [] }; }
  async getHealthCheck(): Promise<any> { return { isHealthy: true, channels: {}, queueSize: 0, averageProcessingTime: 0, errors: [] }; }
  async cleanupOldRecords(_olderThanDays: number): Promise<number> { return 0; }
  async exportDeliveryData(_dateRange: any, _format: any): Promise<string> { return ''; }
  async getServiceStatistics(): Promise<any> { return { totalDeliveries: 0, dailyAverage: 0, peakDeliveries: 0, uptimePercentage: 100, averageResponseTime: 0, errorRate: 0, costEfficiency: 0 }; }
}
