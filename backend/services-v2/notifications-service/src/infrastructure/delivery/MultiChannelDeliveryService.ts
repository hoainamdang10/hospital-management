/**
 * MultiChannelDeliveryService - Infrastructure Delivery Service
 * Multi-channel notification delivery service with Vietnamese healthcare optimization
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */

import { IDeliveryService, DeliveryRequest, DeliveryResult, DeliveryAnalytics } from '../../domain/services/IDeliveryService';
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
            channel: channelType,
            status: 'FAILED',
            failureReason: `Không tìm thấy provider cho kênh ${channelType}`,
            attemptedAt: new Date(),
            retryable: false
          });
          continue;
        }

        // Check if provider is available
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          results.push({
            channel: channelType,
            status: 'FAILED',
            failureReason: `Provider ${channelType} không khả dụng`,
            attemptedAt: new Date(),
            retryable: true
          });
          continue;
        }

        // Create delivery promise
        const deliveryPromise = this.deliverToChannel(provider, {
          recipient: request.recipient,
          content: request.content,
          channel,
          metadata: {
            ...request.metadata,
            notificationId: request.notificationId,
            priority: request.priority
          }
        });

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
            channel: channelType,
            status: 'FAILED',
            failureReason: `Lỗi delivery: ${result.reason?.message || 'Lỗi không xác định'}`,
            attemptedAt: new Date(),
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
  private async deliverToChannel(
    provider: ChannelProvider,
    request: {
      recipient: RecipientInfo;
      content: NotificationContent;
      channel: NotificationChannel;
      metadata?: any;
    }
  ): Promise<DeliveryResult> {
    const startTime = Date.now();
    const channelType = request.channel.getType();

    try {
      // Validate content for channel
      const contentValidation = request.content.validateForChannel(channelType);
      if (!contentValidation.valid) {
        return {
          channel: channelType,
          status: 'FAILED',
          failureReason: `Nội dung không hợp lệ cho kênh ${channelType}: ${contentValidation.errors.join(', ')}`,
          attemptedAt: new Date(),
          retryable: false
        };
      }

      // Check recipient preferences
      if (!this.shouldDeliverToChannel(request.recipient, request.channel)) {
        return {
          channel: channelType,
          status: 'FAILED',
          failureReason: 'Người nhận đã tắt thông báo cho kênh này',
          attemptedAt: new Date(),
          retryable: false
        };
      }

      // Check quiet hours
      if (request.recipient.isInQuietHours()) {
        return {
          channel: channelType,
          status: 'FAILED',
          failureReason: 'Trong giờ nghỉ của người nhận',
          attemptedAt: new Date(),
          retryable: true
        };
      }

      // Attempt delivery
      const deliveryResult = await provider.deliver(request);
      const deliveryTime = Date.now() - startTime;

      return {
        channel: channelType,
        status: deliveryResult.status,
        messageId: deliveryResult.messageId,
        deliveredAt: deliveryResult.deliveredAt,
        failureReason: deliveryResult.failureReason,
        attemptedAt: new Date(startTime),
        deliveryTime,
        retryable: deliveryResult.status === 'FAILED' && this.isRetryableFailure(deliveryResult.failureReason),
        providerResponse: deliveryResult.providerResponse
      };

    } catch (error) {
      const deliveryTime = Date.now() - startTime;
      
      return {
        channel: channelType,
        status: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'Lỗi không xác định',
        attemptedAt: new Date(startTime),
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
    if (!preferences.enabledChannels.includes(channel.getType())) {
      return false;
    }

    // Check if recipient has opted out
    if (preferences.optedOut) {
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
        if (result.status === 'SENT' && result.messageId) {
          const provider = this.providers.get(result.channel);
          if (provider) {
            try {
              const status = await provider.getDeliveryStatus(result.messageId);
              updatedResults.push({
                ...result,
                status: status.status,
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
   * Get delivery analytics
   */
  public async getDeliveryAnalytics(dateRange: { start: Date; end: Date }): Promise<DeliveryAnalytics> {
    try {
      // This would typically query a database or analytics service
      // For now, we'll return mock analytics based on delivery history
      
      const allResults: DeliveryResult[] = [];
      this.deliveryHistory.forEach(results => {
        allResults.push(...results.filter(r => 
          r.attemptedAt >= dateRange.start && r.attemptedAt <= dateRange.end
        ));
      });

      // Calculate channel performance
      const channelPerformance: Record<string, {
        totalAttempts: number;
        successful: number;
        failed: number;
        averageDeliveryTime: number;
        successRate: number;
      }> = {};

      const channelStats: Record<string, {
        attempts: number;
        successes: number;
        deliveryTimes: number[];
      }> = {};

      allResults.forEach(result => {
        const channel = result.channel;
        
        if (!channelStats[channel]) {
          channelStats[channel] = {
            attempts: 0,
            successes: 0,
            deliveryTimes: []
          };
        }

        channelStats[channel].attempts++;
        
        if (result.status === 'SENT' || result.status === 'DELIVERED') {
          channelStats[channel].successes++;
        }

        if (result.deliveryTime) {
          channelStats[channel].deliveryTimes.push(result.deliveryTime);
        }
      });

      Object.entries(channelStats).forEach(([channel, stats]) => {
        const averageDeliveryTime = stats.deliveryTimes.length > 0
          ? Math.round(stats.deliveryTimes.reduce((sum, time) => sum + time, 0) / stats.deliveryTimes.length)
          : 0;

        channelPerformance[channel] = {
          totalAttempts: stats.attempts,
          successful: stats.successes,
          failed: stats.attempts - stats.successes,
          averageDeliveryTime,
          successRate: stats.attempts > 0 ? Math.round((stats.successes / stats.attempts) * 100) : 0
        };
      });

      // Calculate delivery trends (simplified)
      const deliveryTrends = this.calculateDeliveryTrends(allResults, dateRange);

      // Calculate peak hours
      const peakHours = this.calculatePeakHours(allResults);

      return {
        channelPerformance,
        deliveryTrends,
        peakHours,
        totalDeliveries: allResults.length,
        successfulDeliveries: allResults.filter(r => r.status === 'SENT' || r.status === 'DELIVERED').length,
        failedDeliveries: allResults.filter(r => r.status === 'FAILED').length,
        averageDeliveryTime: this.calculateAverageDeliveryTime(allResults)
      };

    } catch (error) {
      throw new Error(`Lỗi khi lấy analytics delivery: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Calculate delivery trends
   */
  private calculateDeliveryTrends(results: DeliveryResult[], dateRange: { start: Date; end: Date }): Array<{
    date: Date;
    total: number;
    successful: number;
    failed: number;
  }> {
    const trends: Record<string, { total: number; successful: number; failed: number }> = {};

    results.forEach(result => {
      const date = result.attemptedAt.toDateString();
      
      if (!trends[date]) {
        trends[date] = { total: 0, successful: 0, failed: 0 };
      }

      trends[date].total++;

      if (result.status === 'SENT' || result.status === 'DELIVERED') {
        trends[date].successful++;
      } else {
        trends[date].failed++;
      }
    });

    return Object.entries(trends).map(([dateStr, stats]) => ({
      date: new Date(dateStr),
      ...stats
    }));
  }

  /**
   * Calculate peak hours
   */
  private calculatePeakHours(results: DeliveryResult[]): Record<number, number> {
    const hourCounts: Record<number, number> = {};

    results.forEach(result => {
      const hour = result.attemptedAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return hourCounts;
  }

  /**
   * Calculate average delivery time
   */
  private calculateAverageDeliveryTime(results: DeliveryResult[]): number {
    const deliveryTimes = results
      .filter(r => r.deliveryTime)
      .map(r => r.deliveryTime!);

    if (deliveryTimes.length === 0) {
      return 0;
    }

    return Math.round(deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length);
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
}
