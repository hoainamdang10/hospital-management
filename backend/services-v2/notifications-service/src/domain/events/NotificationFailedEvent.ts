/**
 * NotificationFailedEvent - Domain Event
 * Fired when a notification fails to be delivered
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '../../../shared/domain/events/DomainEvent';
import { NotificationId } from '../value-objects/NotificationId';

export type FailureReason = 
  | 'INVALID_RECIPIENT'
  | 'CHANNEL_UNAVAILABLE'
  | 'CONTENT_VALIDATION_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PROVIDER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'AUTHENTICATION_FAILED'
  | 'INSUFFICIENT_CREDITS'
  | 'RECIPIENT_OPTED_OUT'
  | 'QUIET_HOURS'
  | 'UNKNOWN_ERROR';

export interface ChannelFailure {
  channel: string;
  reason: FailureReason;
  errorMessage: string;
  errorCode?: string;
  providerError?: any;
  attemptedAt: Date;
  retryable: boolean;
  nextRetryAt?: Date;
}

export interface NotificationFailedEventData {
  notificationId: string;
  recipientId: string;
  recipientType: string;
  templateType: string;
  channelFailures: ChannelFailure[];
  failedAt: Date;
  priority: string;
  totalAttempts: number;
  canRetry: boolean;
  nextRetryAt?: Date;
  healthcareContext?: {
    patientId?: string;
    doctorId?: string;
    appointmentId?: string;
    medicalRecordId?: string;
  };
  metadata: {
    source: string;
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    originalScheduledAt?: Date;
  };
}

export class NotificationFailedEvent extends DomainEvent<NotificationFailedEventData> {
  public static readonly EVENT_TYPE = 'notification.failed';

  constructor(data: NotificationFailedEventData) {
    super(
      NotificationFailedEvent.EVENT_TYPE,
      data,
      new Date(),
      `notification-failed-${data.notificationId}`
    );
  }

  /**
   * Create event from failure information
   */
  public static create(
    notificationId: NotificationId,
    recipientId: string,
    recipientType: string,
    templateType: string,
    channelFailures: ChannelFailure[],
    priority: string,
    totalAttempts: number,
    options: {
      canRetry?: boolean;
      nextRetryAt?: Date;
      healthcareContext?: {
        patientId?: string;
        doctorId?: string;
        appointmentId?: string;
        medicalRecordId?: string;
      };
      metadata?: {
        source?: string;
        correlationId?: string;
        userId?: string;
        sessionId?: string;
        originalScheduledAt?: Date;
      };
    } = {}
  ): NotificationFailedEvent {
    const data: NotificationFailedEventData = {
      notificationId: notificationId.getValue(),
      recipientId,
      recipientType,
      templateType,
      channelFailures,
      failedAt: new Date(),
      priority,
      totalAttempts,
      canRetry: options.canRetry ?? false,
      nextRetryAt: options.nextRetryAt,
      healthcareContext: options.healthcareContext,
      metadata: {
        source: options.metadata?.source || 'notifications-service',
        correlationId: options.metadata?.correlationId,
        userId: options.metadata?.userId,
        sessionId: options.metadata?.sessionId,
        originalScheduledAt: options.metadata?.originalScheduledAt
      }
    };

    return new NotificationFailedEvent(data);
  }

  /**
   * Get notification ID
   */
  public getNotificationId(): string {
    return this.data.notificationId;
  }

  /**
   * Get recipient ID
   */
  public getRecipientId(): string {
    return this.data.recipientId;
  }

  /**
   * Get recipient type
   */
  public getRecipientType(): string {
    return this.data.recipientType;
  }

  /**
   * Get template type
   */
  public getTemplateType(): string {
    return this.data.templateType;
  }

  /**
   * Get channel failures
   */
  public getChannelFailures(): ChannelFailure[] {
    return [...this.data.channelFailures];
  }

  /**
   * Get failed timestamp
   */
  public getFailedAt(): Date {
    return new Date(this.data.failedAt);
  }

  /**
   * Get priority
   */
  public getPriority(): string {
    return this.data.priority;
  }

  /**
   * Get total attempts made
   */
  public getTotalAttempts(): number {
    return this.data.totalAttempts;
  }

  /**
   * Check if notification can be retried
   */
  public canRetry(): boolean {
    return this.data.canRetry;
  }

  /**
   * Get next retry time
   */
  public getNextRetryAt(): Date | undefined {
    return this.data.nextRetryAt ? new Date(this.data.nextRetryAt) : undefined;
  }

  /**
   * Get failed channels
   */
  public getFailedChannels(): string[] {
    return this.data.channelFailures.map(failure => failure.channel);
  }

  /**
   * Get retryable channels
   */
  public getRetryableChannels(): string[] {
    return this.data.channelFailures
      .filter(failure => failure.retryable)
      .map(failure => failure.channel);
  }

  /**
   * Get non-retryable channels
   */
  public getNonRetryableChannels(): string[] {
    return this.data.channelFailures
      .filter(failure => !failure.retryable)
      .map(failure => failure.channel);
  }

  /**
   * Get failure for specific channel
   */
  public getChannelFailure(channel: string): ChannelFailure | undefined {
    return this.data.channelFailures.find(failure => failure.channel === channel);
  }

  /**
   * Check if specific channel failed
   */
  public didChannelFail(channel: string): boolean {
    return this.data.channelFailures.some(failure => failure.channel === channel);
  }

  /**
   * Check if specific channel is retryable
   */
  public isChannelRetryable(channel: string): boolean {
    const failure = this.getChannelFailure(channel);
    return failure?.retryable || false;
  }

  /**
   * Get most common failure reason
   */
  public getMostCommonFailureReason(): FailureReason {
    const reasonCounts = new Map<FailureReason, number>();
    
    this.data.channelFailures.forEach(failure => {
      const count = reasonCounts.get(failure.reason) || 0;
      reasonCounts.set(failure.reason, count + 1);
    });

    let mostCommon: FailureReason = 'UNKNOWN_ERROR';
    let maxCount = 0;

    reasonCounts.forEach((count, reason) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = reason;
      }
    });

    return mostCommon;
  }

  /**
   * Check if failure is due to recipient issues
   */
  public isRecipientIssue(): boolean {
    const recipientReasons: FailureReason[] = [
      'INVALID_RECIPIENT',
      'RECIPIENT_OPTED_OUT',
      'QUIET_HOURS'
    ];

    return this.data.channelFailures.some(failure => 
      recipientReasons.includes(failure.reason)
    );
  }

  /**
   * Check if failure is due to system issues
   */
  public isSystemIssue(): boolean {
    const systemReasons: FailureReason[] = [
      'CHANNEL_UNAVAILABLE',
      'PROVIDER_ERROR',
      'NETWORK_ERROR',
      'TIMEOUT',
      'AUTHENTICATION_FAILED'
    ];

    return this.data.channelFailures.some(failure => 
      systemReasons.includes(failure.reason)
    );
  }

  /**
   * Check if failure is due to content issues
   */
  public isContentIssue(): boolean {
    const contentReasons: FailureReason[] = [
      'CONTENT_VALIDATION_FAILED'
    ];

    return this.data.channelFailures.some(failure => 
      contentReasons.includes(failure.reason)
    );
  }

  /**
   * Check if failure is due to rate limiting
   */
  public isRateLimited(): boolean {
    return this.data.channelFailures.some(failure => 
      failure.reason === 'RATE_LIMIT_EXCEEDED'
    );
  }

  /**
   * Check if failure is due to insufficient credits
   */
  public isInsufficientCredits(): boolean {
    return this.data.channelFailures.some(failure => 
      failure.reason === 'INSUFFICIENT_CREDITS'
    );
  }

  /**
   * Get healthcare context
   */
  public getHealthcareContext(): any {
    return this.data.healthcareContext ? { ...this.data.healthcareContext } : undefined;
  }

  /**
   * Get correlation ID
   */
  public getCorrelationId(): string | undefined {
    return this.data.metadata.correlationId;
  }

  /**
   * Get original scheduled time
   */
  public getOriginalScheduledAt(): Date | undefined {
    return this.data.metadata.originalScheduledAt ? 
      new Date(this.data.metadata.originalScheduledAt) : undefined;
  }

  /**
   * Calculate time since original schedule
   */
  public getTimeSinceScheduled(): number | undefined {
    const originalTime = this.getOriginalScheduledAt();
    if (!originalTime) return undefined;
    
    return this.data.failedAt.getTime() - originalTime.getTime();
  }

  /**
   * Check if this is a critical healthcare notification
   */
  public isCriticalHealthcareNotification(): boolean {
    return this.data.priority === 'URGENT' && !!this.data.healthcareContext;
  }

  /**
   * Get Vietnamese failure reason description
   */
  public getVietnameseFailureReason(reason: FailureReason): string {
    const descriptions: Record<FailureReason, string> = {
      'INVALID_RECIPIENT': 'Thông tin người nhận không hợp lệ',
      'CHANNEL_UNAVAILABLE': 'Kênh gửi không khả dụng',
      'CONTENT_VALIDATION_FAILED': 'Nội dung không hợp lệ',
      'RATE_LIMIT_EXCEEDED': 'Vượt quá giới hạn tần suất gửi',
      'PROVIDER_ERROR': 'Lỗi từ nhà cung cấp dịch vụ',
      'NETWORK_ERROR': 'Lỗi kết nối mạng',
      'TIMEOUT': 'Hết thời gian chờ',
      'AUTHENTICATION_FAILED': 'Xác thực thất bại',
      'INSUFFICIENT_CREDITS': 'Không đủ credit',
      'RECIPIENT_OPTED_OUT': 'Người nhận đã từ chối nhận thông báo',
      'QUIET_HOURS': 'Trong giờ nghỉ của người nhận',
      'UNKNOWN_ERROR': 'Lỗi không xác định'
    };

    return descriptions[reason];
  }

  /**
   * Get Vietnamese description of the event
   */
  public getVietnameseDescription(): string {
    const channelCount = this.data.channelFailures.length;
    const retryableCount = this.getRetryableChannels().length;
    const mostCommonReason = this.getMostCommonFailureReason();
    const reasonDescription = this.getVietnameseFailureReason(mostCommonReason);

    let description = `Gửi thông báo ${this.data.templateType} cho ${this.data.recipientType} thất bại`;
    
    if (channelCount === 1) {
      description += ` qua kênh ${this.data.channelFailures[0].channel}`;
    } else {
      description += ` qua ${channelCount} kênh`;
    }

    description += ` - Lý do: ${reasonDescription}`;

    if (this.canRetry() && retryableCount > 0) {
      description += ` (Có thể thử lại ${retryableCount} kênh)`;
    }

    return description;
  }

  /**
   * Create integration event for external systems
   */
  public toIntegrationEvent(): object {
    return {
      eventType: 'NotificationFailed',
      eventId: this.eventId,
      timestamp: this.timestamp,
      data: {
        notificationId: this.data.notificationId,
        recipientId: this.data.recipientId,
        recipientType: this.data.recipientType,
        templateType: this.data.templateType,
        failedChannels: this.getFailedChannels(),
        retryableChannels: this.getRetryableChannels(),
        mostCommonFailureReason: this.getMostCommonFailureReason(),
        failedAt: this.data.failedAt,
        priority: this.data.priority,
        totalAttempts: this.data.totalAttempts,
        canRetry: this.data.canRetry,
        nextRetryAt: this.data.nextRetryAt,
        healthcareContext: this.data.healthcareContext,
        correlationId: this.data.metadata.correlationId
      }
    };
  }

  /**
   * Create alert data for monitoring
   */
  public toAlert(): object {
    return {
      alertType: 'NOTIFICATION_FAILURE',
      severity: this.isCriticalHealthcareNotification() ? 'CRITICAL' : 'WARNING',
      notificationId: this.data.notificationId,
      recipientType: this.data.recipientType,
      templateType: this.data.templateType,
      failedChannels: this.getFailedChannels(),
      failureReasons: this.data.channelFailures.map(f => f.reason),
      mostCommonReason: this.getMostCommonFailureReason(),
      canRetry: this.data.canRetry,
      totalAttempts: this.data.totalAttempts,
      priority: this.data.priority,
      timestamp: this.timestamp,
      description: this.getVietnameseDescription()
    };
  }

  /**
   * Create audit log entry
   */
  public toAuditLog(): object {
    return {
      action: 'NOTIFICATION_FAILED',
      entityType: 'Notification',
      entityId: this.data.notificationId,
      userId: this.data.metadata.userId,
      sessionId: this.data.metadata.sessionId,
      timestamp: this.timestamp,
      details: {
        recipientId: this.data.recipientId,
        recipientType: this.data.recipientType,
        templateType: this.data.templateType,
        failedChannels: this.getFailedChannels(),
        failureReasons: this.data.channelFailures.map(f => ({
          channel: f.channel,
          reason: f.reason,
          errorMessage: f.errorMessage
        })),
        failedAt: this.data.failedAt,
        priority: this.data.priority,
        totalAttempts: this.data.totalAttempts,
        canRetry: this.data.canRetry,
        healthcareContext: this.data.healthcareContext
      },
      correlationId: this.data.metadata.correlationId
    };
  }

  /**
   * String representation
   */
  public toString(): string {
    const channelCount = this.data.channelFailures.length;
    const mostCommonReason = this.getMostCommonFailureReason();
    return `NotificationFailedEvent(${this.data.notificationId}, ${channelCount} channels, ${mostCommonReason})`;
  }
}
