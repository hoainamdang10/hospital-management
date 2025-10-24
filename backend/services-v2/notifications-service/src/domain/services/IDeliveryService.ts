/**
 * IDeliveryService - Domain Service Interface
 * Service interface for notification delivery across multiple channels
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { NotificationChannel } from '../value-objects/NotificationChannel';
import { NotificationContent } from '../value-objects/NotificationContent';
import { RecipientInfo } from '../value-objects/RecipientInfo';

export type DeliveryStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

export interface DeliveryRequest {
  notificationId: string;
  recipient: RecipientInfo;
  content: NotificationContent;
  channels: NotificationChannel[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: {
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    healthcareContext?: any;
  };
}

export interface DeliveryResult {
  notificationId: string;
  channel: string;
  success: boolean;
  status: DeliveryStatus;
  deliveredAt?: Date;
  failureReason?: string;
  providerId?: string;
  providerResponse?: any;
  deliveryTime: number;
  cost?: number;
  retryable: boolean;
  nextRetryAt?: Date;
}

export interface DeliveryAttempt {
  attemptNumber: number;
  channel: string;
  attemptedAt: Date;
  status: DeliveryStatus;
  errorMessage?: string;
  deliveryTime: number;
  cost?: number;
}

export interface ChannelHealth {
  channel: string;
  isHealthy: boolean;
  successRate: number;
  averageDeliveryTime: number;
  lastSuccessfulDelivery?: Date;
  lastFailure?: Date;
  currentLoad: number;
  maxCapacity: number;
  rateLimitStatus: {
    remaining: number;
    resetAt: Date;
  };
}

export interface DeliveryMetrics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  averageDeliveryTime: number;
  deliveriesByChannel: Record<string, number>;
  deliveriesByStatus: Record<DeliveryStatus, number>;
  costByChannel: Record<string, number>;
  totalCost: number;
}

export interface IDeliveryService {
  /**
   * Deliver notification through specified channels
   */
  deliver(request: DeliveryRequest): Promise<DeliveryResult[]>;

  /**
   * Deliver notification through single channel
   */
  deliverToChannel(
    notificationId: string,
    recipient: RecipientInfo,
    content: NotificationContent,
    channel: NotificationChannel
  ): Promise<DeliveryResult>;

  /**
   * Schedule notification for future delivery
   */
  scheduleDelivery(request: DeliveryRequest): Promise<string>; // Returns schedule ID

  /**
   * Cancel scheduled delivery
   */
  cancelScheduledDelivery(scheduleId: string): Promise<boolean>;

  /**
   * Retry failed delivery
   */
  retryDelivery(
    notificationId: string,
    failedChannels: string[],
    maxRetries?: number
  ): Promise<DeliveryResult[]>;

  /**
   * Get delivery status
   */
  getDeliveryStatus(notificationId: string): Promise<DeliveryResult[]>;

  /**
   * Get delivery attempts history
   */
  getDeliveryAttempts(notificationId: string): Promise<DeliveryAttempt[]>;

  /**
   * Check if recipient can receive notifications
   */
  canDeliverToRecipient(
    recipient: RecipientInfo,
    channels: NotificationChannel[],
    currentTime?: Date
  ): Promise<{
    canDeliver: boolean;
    availableChannels: string[];
    blockedChannels: string[];
    reasons: Record<string, string>;
  }>;

  /**
   * Validate delivery request
   */
  validateDeliveryRequest(request: DeliveryRequest): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  /**
   * Get optimal delivery channels for recipient
   */
  getOptimalChannels(
    recipient: RecipientInfo,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    contentType?: string
  ): Promise<NotificationChannel[]>;

  /**
   * Get channel health status
   */
  getChannelHealth(channel?: string): Promise<ChannelHealth[]>;

  /**
   * Get delivery metrics
   */
  getDeliveryMetrics(
    dateRange?: { start: Date; end: Date },
    filters?: {
      channel?: string;
      recipientType?: string;
      priority?: string;
      status?: DeliveryStatus;
    }
  ): Promise<DeliveryMetrics>;

  /**
   * Get delivery queue status
   */
  getQueueStatus(): Promise<{
    totalQueued: number;
    queuedByPriority: Record<string, number>;
    queuedByChannel: Record<string, number>;
    averageWaitTime: number;
    oldestQueuedItem?: Date;
  }>;

  /**
   * Process delivery queue
   */
  processQueue(batchSize?: number): Promise<{
    processed: number;
    successful: number;
    failed: number;
    remaining: number;
  }>;

  /**
   * Pause delivery for specific channel
   */
  pauseChannel(channel: string, reason?: string): Promise<void>;

  /**
   * Resume delivery for specific channel
   */
  resumeChannel(channel: string): Promise<void>;

  /**
   * Get paused channels
   */
  getPausedChannels(): Promise<Array<{
    channel: string;
    pausedAt: Date;
    reason?: string;
  }>>;

  /**
   * Set delivery rate limit for channel
   */
  setChannelRateLimit(
    channel: string,
    maxRequests: number,
    windowMs: number
  ): Promise<void>;

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(channel: string): Promise<{
    maxRequests: number;
    windowMs: number;
    remaining: number;
    resetAt: Date;
  }>;

  /**
   * Test channel connectivity and configuration
   */
  testChannel(channel: string): Promise<{
    isHealthy: boolean;
    responseTime: number;
    errorMessage?: string;
    providerStatus?: any;
  }>;

  /**
   * Get delivery cost estimate
   */
  estimateDeliveryCost(
    channels: string[],
    recipientCount: number,
    contentLength?: number
  ): Promise<{
    totalCost: number;
    costByChannel: Record<string, number>;
    currency: string;
  }>;

  /**
   * Get delivery analytics
   */
  getDeliveryAnalytics(
    dateRange: { start: Date; end: Date }
  ): Promise<{
    deliveryTrends: Array<{
      date: Date;
      total: number;
      successful: number;
      failed: number;
    }>;
    channelPerformance: Record<string, {
      successRate: number;
      averageDeliveryTime: number;
      totalDeliveries: number;
      cost: number;
    }>;
    peakHours: Record<number, number>;
    failureReasons: Record<string, number>;
    recipientEngagement: {
      deliveryRate: number;
      openRate?: number;
      clickRate?: number;
      unsubscribeRate?: number;
    };
  }>;

  /**
   * Get failed deliveries requiring attention
   */
  getFailedDeliveriesRequiringAttention(): Promise<Array<{
    notificationId: string;
    recipientId: string;
    failedChannels: string[];
    failureReasons: string[];
    lastAttemptAt: Date;
    retryCount: number;
    canRetry: boolean;
    priority: string;
  }>>;

  /**
   * Bulk delivery for multiple notifications
   */
  bulkDeliver(requests: DeliveryRequest[]): Promise<DeliveryResult[]>;

  /**
   * Get delivery templates for specific channels
   */
  getChannelTemplates(channel: string): Promise<Array<{
    templateId: string;
    templateType: string;
    successRate: number;
    averageDeliveryTime: number;
  }>>;

  /**
   * Configure channel provider settings
   */
  configureChannelProvider(
    channel: string,
    providerConfig: Record<string, any>
  ): Promise<void>;

  /**
   * Get channel provider configuration
   */
  getChannelProviderConfig(channel: string): Promise<Record<string, any>>;

  /**
   * Switch channel provider (for failover)
   */
  switchChannelProvider(
    channel: string,
    newProvider: string,
    config: Record<string, any>
  ): Promise<void>;

  /**
   * Get available providers for channel
   */
  getAvailableProviders(channel: string): Promise<Array<{
    providerId: string;
    name: string;
    isHealthy: boolean;
    features: string[];
    pricing: any;
  }>>;

  /**
   * Monitor delivery performance
   */
  monitorPerformance(): Promise<{
    overallHealth: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    channelHealth: Record<string, 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'>;
    alerts: Array<{
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      message: string;
      channel?: string;
      timestamp: Date;
    }>;
    recommendations: string[];
  }>;

  /**
   * Get delivery service health check
   */
  getHealthCheck(): Promise<{
    isHealthy: boolean;
    channels: Record<string, boolean>;
    queueSize: number;
    averageProcessingTime: number;
    lastDeliveryAt?: Date;
    errors: string[];
  }>;

  /**
   * Cleanup old delivery records
   */
  cleanupOldRecords(olderThanDays: number): Promise<number>;

  /**
   * Export delivery data for analysis
   */
  exportDeliveryData(
    dateRange: { start: Date; end: Date },
    format: 'JSON' | 'CSV' | 'EXCEL'
  ): Promise<string>; // Returns file path or data

  /**
   * Get delivery service statistics
   */
  getServiceStatistics(): Promise<{
    totalDeliveries: number;
    dailyAverage: number;
    peakDeliveries: number;
    uptimePercentage: number;
    averageResponseTime: number;
    errorRate: number;
    costEfficiency: number;
  }>;
}
