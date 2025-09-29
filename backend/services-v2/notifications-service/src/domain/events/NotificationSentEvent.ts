/**
 * NotificationSentEvent - Domain Event
 * Fired when a notification is successfully sent
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '../../../shared/domain/events/DomainEvent';
import { NotificationId } from '../value-objects/NotificationId';

export interface DeliveryResult {
  channel: string;
  success: boolean;
  deliveredAt: Date;
  providerId?: string; // External provider message ID
  providerResponse?: any;
  deliveryTime: number; // Time taken in milliseconds
  cost?: number; // Delivery cost if applicable
}

export interface NotificationSentEventData {
  notificationId: string;
  recipientId: string;
  recipientType: string;
  templateType: string;
  deliveryResults: DeliveryResult[];
  totalDeliveryTime: number;
  successfulChannels: string[];
  failedChannels: string[];
  sentAt: Date;
  priority: string;
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
    retryAttempt?: number;
  };
}

export class NotificationSentEvent extends DomainEvent<NotificationSentEventData> {
  public static readonly EVENT_TYPE = 'notification.sent';

  constructor(data: NotificationSentEventData) {
    super(
      NotificationSentEvent.EVENT_TYPE,
      data,
      new Date(),
      `notification-sent-${data.notificationId}`
    );
  }

  /**
   * Create event from delivery results
   */
  public static create(
    notificationId: NotificationId,
    recipientId: string,
    recipientType: string,
    templateType: string,
    deliveryResults: DeliveryResult[],
    priority: string,
    options: {
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
        retryAttempt?: number;
      };
    } = {}
  ): NotificationSentEvent {
    const successfulChannels = deliveryResults
      .filter(result => result.success)
      .map(result => result.channel);

    const failedChannels = deliveryResults
      .filter(result => !result.success)
      .map(result => result.channel);

    const totalDeliveryTime = Math.max(...deliveryResults.map(result => result.deliveryTime));

    const data: NotificationSentEventData = {
      notificationId: notificationId.getValue(),
      recipientId,
      recipientType,
      templateType,
      deliveryResults,
      totalDeliveryTime,
      successfulChannels,
      failedChannels,
      sentAt: new Date(),
      priority,
      healthcareContext: options.healthcareContext,
      metadata: {
        source: options.metadata?.source || 'notifications-service',
        correlationId: options.metadata?.correlationId,
        userId: options.metadata?.userId,
        sessionId: options.metadata?.sessionId,
        retryAttempt: options.metadata?.retryAttempt || 0
      }
    };

    return new NotificationSentEvent(data);
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
   * Get delivery results
   */
  public getDeliveryResults(): DeliveryResult[] {
    return [...this.data.deliveryResults];
  }

  /**
   * Get successful channels
   */
  public getSuccessfulChannels(): string[] {
    return [...this.data.successfulChannels];
  }

  /**
   * Get failed channels
   */
  public getFailedChannels(): string[] {
    return [...this.data.failedChannels];
  }

  /**
   * Get sent timestamp
   */
  public getSentAt(): Date {
    return new Date(this.data.sentAt);
  }

  /**
   * Get total delivery time
   */
  public getTotalDeliveryTime(): number {
    return this.data.totalDeliveryTime;
  }

  /**
   * Get priority
   */
  public getPriority(): string {
    return this.data.priority;
  }

  /**
   * Check if all channels were successful
   */
  public isFullySuccessful(): boolean {
    return this.data.failedChannels.length === 0;
  }

  /**
   * Check if partially successful (some channels succeeded)
   */
  public isPartiallySuccessful(): boolean {
    return this.data.successfulChannels.length > 0 && this.data.failedChannels.length > 0;
  }

  /**
   * Check if completely failed (no channels succeeded)
   */
  public isCompletelyFailed(): boolean {
    return this.data.successfulChannels.length === 0;
  }

  /**
   * Get success rate as percentage
   */
  public getSuccessRate(): number {
    const total = this.data.deliveryResults.length;
    if (total === 0) return 0;
    
    const successful = this.data.successfulChannels.length;
    return Math.round((successful / total) * 100);
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
   * Get retry attempt number
   */
  public getRetryAttempt(): number {
    return this.data.metadata.retryAttempt || 0;
  }

  /**
   * Check if this was a retry attempt
   */
  public isRetryAttempt(): boolean {
    return this.getRetryAttempt() > 0;
  }

  /**
   * Get delivery result for specific channel
   */
  public getDeliveryResultForChannel(channel: string): DeliveryResult | undefined {
    return this.data.deliveryResults.find(result => result.channel === channel);
  }

  /**
   * Check if specific channel was successful
   */
  public wasChannelSuccessful(channel: string): boolean {
    return this.data.successfulChannels.includes(channel);
  }

  /**
   * Check if specific channel failed
   */
  public wasChannelFailed(channel: string): boolean {
    return this.data.failedChannels.includes(channel);
  }

  /**
   * Get total delivery cost
   */
  public getTotalDeliveryCost(): number {
    return this.data.deliveryResults
      .filter(result => result.cost)
      .reduce((total, result) => total + (result.cost || 0), 0);
  }

  /**
   * Get fastest delivery time
   */
  public getFastestDeliveryTime(): number {
    const successfulResults = this.data.deliveryResults.filter(result => result.success);
    if (successfulResults.length === 0) return 0;
    
    return Math.min(...successfulResults.map(result => result.deliveryTime));
  }

  /**
   * Get slowest delivery time
   */
  public getSlowestDeliveryTime(): number {
    const successfulResults = this.data.deliveryResults.filter(result => result.success);
    if (successfulResults.length === 0) return 0;
    
    return Math.max(...successfulResults.map(result => result.deliveryTime));
  }

  /**
   * Get average delivery time
   */
  public getAverageDeliveryTime(): number {
    const successfulResults = this.data.deliveryResults.filter(result => result.success);
    if (successfulResults.length === 0) return 0;
    
    const totalTime = successfulResults.reduce((sum, result) => sum + result.deliveryTime, 0);
    return Math.round(totalTime / successfulResults.length);
  }

  /**
   * Check if delivery was fast (under 5 seconds)
   */
  public wasFastDelivery(): boolean {
    return this.data.totalDeliveryTime < 5000;
  }

  /**
   * Check if delivery was slow (over 30 seconds)
   */
  public wasSlowDelivery(): boolean {
    return this.data.totalDeliveryTime > 30000;
  }

  /**
   * Get Vietnamese description of the event
   */
  public getVietnameseDescription(): string {
    const successCount = this.data.successfulChannels.length;
    const totalCount = this.data.deliveryResults.length;
    const successRate = this.getSuccessRate();

    if (this.isFullySuccessful()) {
      return `Đã gửi thành công thông báo ${this.data.templateType} cho ${this.data.recipientType} qua ${successCount} kênh (${this.data.totalDeliveryTime}ms)`;
    } else if (this.isPartiallySuccessful()) {
      return `Đã gửi một phần thông báo ${this.data.templateType} cho ${this.data.recipientType} (${successCount}/${totalCount} kênh thành công, ${successRate}%)`;
    } else {
      return `Gửi thông báo ${this.data.templateType} cho ${this.data.recipientType} thất bại hoàn toàn`;
    }
  }

  /**
   * Create integration event for external systems
   */
  public toIntegrationEvent(): object {
    return {
      eventType: 'NotificationSent',
      eventId: this.eventId,
      timestamp: this.timestamp,
      data: {
        notificationId: this.data.notificationId,
        recipientId: this.data.recipientId,
        recipientType: this.data.recipientType,
        templateType: this.data.templateType,
        successfulChannels: this.data.successfulChannels,
        failedChannels: this.data.failedChannels,
        successRate: this.getSuccessRate(),
        totalDeliveryTime: this.data.totalDeliveryTime,
        sentAt: this.data.sentAt,
        priority: this.data.priority,
        healthcareContext: this.data.healthcareContext,
        correlationId: this.data.metadata.correlationId,
        retryAttempt: this.data.metadata.retryAttempt
      }
    };
  }

  /**
   * Create metrics data for monitoring
   */
  public toMetrics(): object {
    return {
      notificationId: this.data.notificationId,
      templateType: this.data.templateType,
      recipientType: this.data.recipientType,
      priority: this.data.priority,
      channelsAttempted: this.data.deliveryResults.length,
      channelsSuccessful: this.data.successfulChannels.length,
      channelsFailed: this.data.failedChannels.length,
      successRate: this.getSuccessRate(),
      totalDeliveryTime: this.data.totalDeliveryTime,
      averageDeliveryTime: this.getAverageDeliveryTime(),
      fastestDeliveryTime: this.getFastestDeliveryTime(),
      slowestDeliveryTime: this.getSlowestDeliveryTime(),
      totalCost: this.getTotalDeliveryCost(),
      retryAttempt: this.data.metadata.retryAttempt,
      timestamp: this.timestamp
    };
  }

  /**
   * Create audit log entry
   */
  public toAuditLog(): object {
    return {
      action: 'NOTIFICATION_SENT',
      entityType: 'Notification',
      entityId: this.data.notificationId,
      userId: this.data.metadata.userId,
      sessionId: this.data.metadata.sessionId,
      timestamp: this.timestamp,
      details: {
        recipientId: this.data.recipientId,
        recipientType: this.data.recipientType,
        templateType: this.data.templateType,
        successfulChannels: this.data.successfulChannels,
        failedChannels: this.data.failedChannels,
        successRate: this.getSuccessRate(),
        totalDeliveryTime: this.data.totalDeliveryTime,
        sentAt: this.data.sentAt,
        priority: this.data.priority,
        retryAttempt: this.data.metadata.retryAttempt,
        healthcareContext: this.data.healthcareContext
      },
      correlationId: this.data.metadata.correlationId
    };
  }

  /**
   * String representation
   */
  public toString(): string {
    return `NotificationSentEvent(${this.data.notificationId}, ${this.getSuccessRate()}% success, ${this.data.totalDeliveryTime}ms)`;
  }
}
