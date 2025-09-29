/**
 * NotificationAggregate - Domain Aggregate Root
 * V2 Clean Architecture + DDD Implementation
 * Core aggregate for notification management with Vietnamese healthcare context
 * Consolidated from NotificationAggregate.ts and notifications.aggregate.ts
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { HealthcareAggregateRoot } from "../../../shared/domain/base/aggregate-root";
import { DomainEvent } from "../../../shared/domain/base/domain-event";
import {
  ChannelFailure,
  NotificationFailedEvent,
} from "../events/NotificationFailedEvent";
import { NotificationScheduledEvent } from "../events/NotificationScheduledEvent";
import {
  DeliveryResult,
  NotificationSentEvent,
} from "../events/NotificationSentEvent";
import { NotificationChannel } from "../value-objects/NotificationChannel";
import { NotificationContent } from "../value-objects/NotificationContent";
import { NotificationId } from "../value-objects/NotificationId";
import { NotificationTemplate } from "../value-objects/NotificationTemplate";
import { RecipientInfo } from "../value-objects/RecipientInfo";

export type NotificationStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PROCESSING"
  | "SENT"
  | "PARTIALLY_SENT"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface NotificationMetadata {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  source: string;
  tags: string[];
  healthcareContext?: {
    patientId?: string;
    doctorId?: string;
    appointmentId?: string;
    medicalRecordId?: string;
    departmentId?: string;
  };
}

export interface DeliveryAttempt {
  attemptNumber: number;
  attemptedAt: Date;
  channels: string[];
  results: DeliveryResult[];
  totalDeliveryTime: number;
  successfulChannels: string[];
  failedChannels: string[];
}

export interface NotificationProps {
  notificationId: NotificationId;
  recipient: RecipientInfo;
  template: NotificationTemplate;
  content: NotificationContent;
  channels: NotificationChannel[];
  status: NotificationStatus;
  priority: NotificationPriority;
  scheduledAt: Date;
  expiresAt?: Date;
  sentAt?: Date;
  deliveryAttempts: DeliveryAttempt[];
  retryCount: number;
  nextRetryAt?: Date;
  metadata: NotificationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationAggregate extends HealthcareAggregateRoot<NotificationProps> {
  private readonly notificationId: NotificationId;
  private recipient: RecipientInfo;
  private template: NotificationTemplate;
  private content: NotificationContent;
  private channels: NotificationChannel[];
  private status: NotificationStatus;
  private priority: NotificationPriority;
  private scheduledAt: Date;
  private expiresAt?: Date;
  private sentAt?: Date;
  private deliveryAttempts: DeliveryAttempt[];
  private retryCount: number;
  private nextRetryAt?: Date;
  private metadata: NotificationMetadata;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(
    notificationId: NotificationId,
    recipient: RecipientInfo,
    template: NotificationTemplate,
    content: NotificationContent,
    channels: NotificationChannel[],
    priority: NotificationPriority,
    scheduledAt: Date,
    metadata: NotificationMetadata,
    expiresAt?: Date
  ) {
    super();
    this.notificationId = notificationId;
    this.recipient = recipient;
    this.template = template;
    this.content = content;
    this.channels = channels;
    this.status = "DRAFT";
    this.priority = priority;
    this.scheduledAt = scheduledAt;
    this.expiresAt = expiresAt;
    this.deliveryAttempts = [];
    this.retryCount = 0;
    this.metadata = metadata;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Create new notification aggregate
   */
  public static create(data: {
    recipient: RecipientInfo;
    template: NotificationTemplate;
    content: NotificationContent;
    channels: NotificationChannel[];
    priority?: NotificationPriority;
    scheduledAt?: Date;
    expiresAt?: Date;
    metadata?: Partial<NotificationMetadata>;
  }): NotificationAggregate {
    // Validate required data
    if (!data.recipient) {
      throw new Error("Thông tin người nhận không được để trống");
    }

    if (!data.template) {
      throw new Error("Template thông báo không được để trống");
    }

    if (!data.content) {
      throw new Error("Nội dung thông báo không được để trống");
    }

    if (!data.channels || data.channels.length === 0) {
      throw new Error("Phải có ít nhất một kênh gửi thông báo");
    }

    // Validate recipient can receive on specified channels
    const availableChannels = data.channels.filter((channel) =>
      data.recipient.canReceiveOnChannel(channel.getType())
    );

    if (availableChannels.length === 0) {
      throw new Error(
        "Người nhận không thể nhận thông báo qua bất kỳ kênh nào được chỉ định"
      );
    }

    // Set defaults
    const priority = data.priority || "NORMAL";
    const scheduledAt = data.scheduledAt || new Date();
    const notificationId = NotificationId.create();

    // Create metadata
    const metadata: NotificationMetadata = {
      source: data.metadata?.source || "notifications-service",
      tags: data.metadata?.tags || [],
      correlationId: data.metadata?.correlationId,
      userId: data.metadata?.userId,
      sessionId: data.metadata?.sessionId,
      healthcareContext: data.metadata?.healthcareContext,
    };

    // Validate expiration
    if (data.expiresAt && data.expiresAt <= scheduledAt) {
      throw new Error("Thời gian hết hạn phải sau thời gian lên lịch");
    }

    const notification = new NotificationAggregate(
      notificationId,
      data.recipient,
      data.template,
      data.content,
      availableChannels,
      priority,
      scheduledAt,
      metadata,
      data.expiresAt
    );

    return notification;
  }

  /**
   * Schedule notification for delivery
   */
  public schedule(): void {
    if (this.status !== "DRAFT") {
      throw new Error("Chỉ có thể lên lịch cho thông báo ở trạng thái DRAFT");
    }

    if (this.isExpired()) {
      throw new Error("Không thể lên lịch cho thông báo đã hết hạn");
    }

    // Check quiet hours for non-urgent notifications
    if (this.priority !== "URGENT" && this.recipient.isInQuietHours()) {
      // Reschedule to after quiet hours
      this.rescheduleAfterQuietHours();
    }

    this.status = "SCHEDULED";
    this.updatedAt = new Date();

    // Raise domain event
    const event = NotificationScheduledEvent.create(
      this.notificationId,
      this.recipient.getRecipientId(),
      this.recipient.getRecipientType(),
      this.template.getTemplateType(),
      this.channels.map((c) => c.getType()),
      this.scheduledAt,
      this.priority,
      {
        isUrgent: this.priority === "URGENT",
        healthcareContext: this.metadata.healthcareContext,
        metadata: {
          source: this.metadata.source,
          correlationId: this.metadata.correlationId,
          userId: this.metadata.userId,
          sessionId: this.metadata.sessionId,
        },
      }
    );

    this.addDomainEvent(event);
  }

  /**
   * Start processing notification
   */
  public startProcessing(): void {
    if (this.status !== "SCHEDULED") {
      throw new Error("Chỉ có thể xử lý thông báo ở trạng thái SCHEDULED");
    }

    if (this.isExpired()) {
      this.markAsExpired();
      return;
    }

    this.status = "PROCESSING";
    this.updatedAt = new Date();
  }

  /**
   * Mark notification as sent with delivery results
   */
  public markAsSent(deliveryResults: DeliveryResult[]): void {
    if (this.status !== "PROCESSING") {
      throw new Error("Chỉ có thể đánh dấu đã gửi cho thông báo đang xử lý");
    }

    const successfulChannels = deliveryResults
      .filter(
        (result) => result.status === "SENT" || result.status === "DELIVERED"
      )
      .map((result) => result.channel);

    const failedChannels = deliveryResults
      .filter((result) => result.status === "FAILED")
      .map((result) => result.channel);

    // Create delivery attempt record
    const attempt: DeliveryAttempt = {
      attemptNumber: this.retryCount + 1,
      attemptedAt: new Date(),
      channels: deliveryResults.map((r) => r.channel),
      results: deliveryResults,
      totalDeliveryTime: Math.max(
        ...deliveryResults.map((r) => r.deliveryTime)
      ),
      successfulChannels,
      failedChannels,
    };

    this.deliveryAttempts.push(attempt);

    // Determine final status
    if (successfulChannels.length === deliveryResults.length) {
      this.status = "SENT";
    } else if (successfulChannels.length > 0) {
      this.status = "PARTIALLY_SENT";
    } else {
      this.status = "FAILED";
    }

    this.sentAt = new Date();
    this.updatedAt = new Date();

    // Raise domain event
    const event = NotificationSentEvent.create(
      this.notificationId,
      this.recipient.getRecipientId(),
      this.recipient.getRecipientType(),
      this.template.getTemplateType(),
      deliveryResults,
      this.priority,
      {
        healthcareContext: this.metadata.healthcareContext,
        metadata: {
          source: this.metadata.source,
          correlationId: this.metadata.correlationId,
          userId: this.metadata.userId,
          sessionId: this.metadata.sessionId,
          retryAttempt: this.retryCount,
        },
      }
    );

    this.addDomainEvent(event);
  }

  /**
   * Mark notification as failed with failure details
   */
  public markAsFailed(channelFailures: ChannelFailure[]): void {
    if (this.status !== "PROCESSING") {
      throw new Error("Chỉ có thể đánh dấu thất bại cho thông báo đang xử lý");
    }

    this.status = "FAILED";
    this.updatedAt = new Date();

    // Check if can retry
    const canRetry =
      this.canRetry() && channelFailures.some((f) => f.retryable);

    if (canRetry) {
      this.scheduleRetry();
    }

    // Raise domain event
    const event = NotificationFailedEvent.create(
      this.notificationId,
      this.recipient.getRecipientId(),
      this.recipient.getRecipientType(),
      this.template.getTemplateType(),
      channelFailures,
      this.priority,
      this.retryCount + 1,
      {
        canRetry,
        nextRetryAt: this.nextRetryAt,
        healthcareContext: this.metadata.healthcareContext,
        metadata: {
          source: this.metadata.source,
          correlationId: this.metadata.correlationId,
          userId: this.metadata.userId,
          sessionId: this.metadata.sessionId,
          originalScheduledAt: this.scheduledAt,
        },
      }
    );

    this.addDomainEvent(event);
  }

  // Getters
  public getId(): NotificationId {
    return this.notificationId;
  }
  public getRecipient(): RecipientInfo {
    return this.recipient;
  }
  public getTemplate(): NotificationTemplate {
    return this.template;
  }
  public getContent(): NotificationContent {
    return this.content;
  }
  public getChannels(): NotificationChannel[] {
    return [...this.channels];
  }
  public getStatus(): NotificationStatus {
    return this.status;
  }
  public getPriority(): NotificationPriority {
    return this.priority;
  }
  public getScheduledAt(): Date {
    return new Date(this.scheduledAt);
  }
  public getExpiresAt(): Date | undefined {
    return this.expiresAt ? new Date(this.expiresAt) : undefined;
  }
  public getSentAt(): Date | undefined {
    return this.sentAt ? new Date(this.sentAt) : undefined;
  }
  public getDeliveryAttempts(): DeliveryAttempt[] {
    return [...this.deliveryAttempts];
  }
  public getRetryCount(): number {
    return this.retryCount;
  }
  public getNextRetryAt(): Date | undefined {
    return this.nextRetryAt ? new Date(this.nextRetryAt) : undefined;
  }
  public getMetadata(): NotificationMetadata {
    return { ...this.metadata };
  }
  public getCreatedAt(): Date {
    return new Date(this.createdAt);
  }
  public getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  /**
   * Check if notification is expired
   */
  public isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Check if notification is urgent
   */
  public isUrgent(): boolean {
    return this.priority === "URGENT";
  }

  /**
   * Check if notification is healthcare-related
   */
  public isHealthcareNotification(): boolean {
    return !!this.metadata.healthcareContext;
  }

  /**
   * Check if notification can be retried
   */
  public canRetry(): boolean {
    const maxRetries = this.isUrgent() ? 5 : 3;
    return this.retryCount < maxRetries && this.status === "FAILED";
  }

  /**
   * Check if notification is ready for processing
   */
  public isReadyForProcessing(): boolean {
    return (
      this.status === "SCHEDULED" &&
      new Date() >= this.scheduledAt &&
      !this.isExpired()
    );
  }

  /**
   * Get success rate from delivery attempts
   */
  public getSuccessRate(): number {
    if (this.deliveryAttempts.length === 0) return 0;

    const totalChannels = this.deliveryAttempts.reduce(
      (sum, attempt) => sum + attempt.channels.length,
      0
    );
    const successfulChannels = this.deliveryAttempts.reduce(
      (sum, attempt) => sum + attempt.successfulChannels.length,
      0
    );

    return totalChannels > 0
      ? Math.round((successfulChannels / totalChannels) * 100)
      : 0;
  }

  /**
   * Private helper methods
   */
  private rescheduleAfterQuietHours(): void {
    const quietHours = this.recipient.getPreferences().quietHours;
    if (!quietHours) return;

    const now = new Date();
    const [endHour, endMinute] = quietHours.end.split(":").map(Number);

    const nextAvailable = new Date(now);
    nextAvailable.setHours(endHour, endMinute, 0, 0);

    // If end time is tomorrow
    if (nextAvailable <= now) {
      nextAvailable.setDate(nextAvailable.getDate() + 1);
    }

    this.scheduledAt = nextAvailable;
  }

  private scheduleRetry(): void {
    this.retryCount++;

    // Exponential backoff: 2^retryCount minutes
    const delayMinutes = Math.pow(2, this.retryCount);
    this.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
  }

  private markAsExpired(): void {
    this.status = "EXPIRED";
    this.updatedAt = new Date();
  }

  // ==================== V2 HEALTHCARE AGGREGATE METHODS ====================

  /**
   * Validate business invariants
   */
  protected validateBusinessInvariants(): void {
    // Recipient must be valid
    if (!this.props.recipient || !this.props.recipient.isValid()) {
      throw new Error('Thông tin người nhận không hợp lệ');
    }

    // Must have at least one delivery channel
    if (!this.props.channels || this.props.channels.length === 0) {
      throw new Error('Phải có ít nhất một kênh gửi thông báo');
    }

    // Content must be valid
    if (!this.props.content || !this.props.content.isValid()) {
      throw new Error('Nội dung thông báo không hợp lệ');
    }

    // Scheduled time must be in the future for new notifications
    if (this.props.status === 'DRAFT' && this.props.scheduledAt <= new Date()) {
      throw new Error('Thời gian lên lịch phải trong tương lai');
    }

    // Expiry time must be after scheduled time
    if (this.props.expiresAt && this.props.expiresAt <= this.props.scheduledAt) {
      throw new Error('Thời gian hết hạn phải sau thời gian lên lịch');
    }
  }

  /**
   * Apply domain event
   */
  protected applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'NotificationScheduled':
        this.props.status = 'SCHEDULED';
        this.props.updatedAt = new Date();
        break;

      case 'NotificationSent':
        this.props.status = 'SENT';
        this.props.sentAt = new Date();
        this.props.updatedAt = new Date();
        break;

      case 'NotificationFailed':
        this.props.status = 'FAILED';
        this.props.updatedAt = new Date();
        break;

      case 'NotificationCancelled':
        this.props.status = 'CANCELLED';
        this.props.updatedAt = new Date();
        break;

      default:
        // Unknown event type - log but don't throw
        console.warn(`Unknown event type: ${event.eventType}`);
    }
  }

  /**
   * Get patient ID if notification is patient-related
   */
  getPatientId(): string | null {
    return this.props.metadata.healthcareContext?.patientId || null;
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): any {
    return {
      id: this.props.notificationId.value,
      recipient: this.props.recipient.toPersistence(),
      template: this.props.template.toPersistence(),
      content: this.props.content.toPersistence(),
      channels: this.props.channels.map(c => c.toPersistence()),
      status: this.props.status,
      priority: this.props.priority,
      scheduled_at: this.props.scheduledAt.toISOString(),
      expires_at: this.props.expiresAt?.toISOString(),
      sent_at: this.props.sentAt?.toISOString(),
      delivery_attempts: this.props.deliveryAttempts,
      retry_count: this.props.retryCount,
      next_retry_at: this.props.nextRetryAt?.toISOString(),
      metadata: this.props.metadata,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }

  /**
   * Vietnamese healthcare compliance check
   */
  public isVietnameseHealthcareCompliant(): boolean {
    // Check if notification has required Vietnamese healthcare information
    const hasHealthcareContext = !!this.props.metadata.healthcareContext;
    const hasValidRecipient = this.props.recipient.isVietnameseCompliant();
    const hasValidContent = this.props.content.isVietnameseCompliant();

    return hasHealthcareContext && hasValidRecipient && hasValidContent;
  }

  /**
   * HIPAA compliance check
   */
  public isHIPAACompliant(): boolean {
    return (
      this.props.recipient.isHIPAACompliant() &&
      this.props.content.isHIPAACompliant() &&
      this.props.channels.every(c => c.isSecure())
    );
  }

  /**
   * Get notification summary for logging (no sensitive data)
   */
  public getSummaryForLogging(): object {
    return {
      notificationId: this.props.notificationId.value,
      status: this.props.status,
      priority: this.props.priority,
      channels: this.props.channels.map(c => c.type),
      scheduledAt: this.props.scheduledAt.toISOString(),
      retryCount: this.props.retryCount,
      hasHealthcareContext: !!this.props.metadata.healthcareContext,
      createdAt: this.props.createdAt.toISOString()
    };
  }
}
