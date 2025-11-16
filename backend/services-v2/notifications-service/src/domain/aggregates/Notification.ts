/**
 * Notification Aggregate - Simplified for Scheduler Integration
 * V2 Clean Architecture + DDD Implementation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Scheduler Integration
 */

import { HealthcareAggregateRoot } from "@shared/domain/base/aggregate-root";
import { DomainEvent } from "@shared/domain/base/domain-event";
import { NotificationSentEvent } from "../events/NotificationSentEvent";
import { NotificationFailedEvent } from "../events/NotificationFailedEvent";
import { NotificationId } from "../value-objects/NotificationId";
import { RecipientInfo } from "../value-objects/RecipientInfo";
import { NotificationContent } from "../value-objects/NotificationContent";
import { NotificationChannel } from "../value-objects/NotificationChannel";
import { DeliveryResult } from "../services/IDeliveryService";

export type NotificationStatus = "PENDING" | "SENT" | "FAILED";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface NotificationMetadata {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  source: string;
  healthcareContext?: {
    patientId?: string;
    doctorId?: string;
    appointmentId?: string;
    medicalRecordId?: string;
  };
}

export interface NotificationProps {
  notificationId: NotificationId;
  recipient: RecipientInfo;
  templateType: string;
  content: NotificationContent;
  channels: NotificationChannel[];
  status: NotificationStatus;
  priority: NotificationPriority;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  deliveryResults?: DeliveryResult[];
  metadata: NotificationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification Aggregate Root
 * Simplified version - chỉ handle sending, không có scheduling logic
 */
export class Notification extends HealthcareAggregateRoot<NotificationProps> {
  private constructor(props: NotificationProps, id?: string) {
    super(props, id);
  }

  // ==================== Getters ====================

  override get id(): string {
    return this.props.notificationId.value;
  }

  get notificationId(): NotificationId {
    return this.props.notificationId;
  }

  getId(): NotificationId {
    return this.props.notificationId;
  }

  get recipient(): RecipientInfo {
    return this.props.recipient;
  }

  getRecipient(): RecipientInfo {
    return this.props.recipient;
  }

  get templateType(): string {
    return this.props.templateType;
  }

  get content(): NotificationContent {
    return this.props.content;
  }

  getContent(): NotificationContent {
    return this.props.content;
  }

  get channels(): NotificationChannel[] {
    return this.props.channels;
  }

  getChannels(): NotificationChannel[] {
    return this.props.channels;
  }

  get status(): NotificationStatus {
    return this.props.status;
  }

  getStatus(): NotificationStatus {
    return this.props.status;
  }

  get priority(): NotificationPriority {
    return this.props.priority;
  }

  getPriority(): NotificationPriority {
    return this.props.priority;
  }

  get sentAt(): Date | undefined {
    return this.props.sentAt;
  }

  getSentAt(): Date | undefined {
    return this.props.sentAt;
  }

  get deliveryResults(): DeliveryResult[] | undefined {
    return this.props.deliveryResults;
  }

  get metadata(): NotificationMetadata {
    return this.props.metadata;
  }

  override get createdAt(): Date {
    return this.props.createdAt;
  }

  override get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  getDeliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  get readAt(): Date | undefined {
    return this.props.readAt;
  }

  getReadAt(): Date | undefined {
    return this.props.readAt;
  }

  getHealthcareContext(): any {
    return this.props.metadata.healthcareContext;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  // ==================== Abstract Methods Implementation ====================

  getPatientId(): string | null {
    return this.props.metadata.healthcareContext?.patientId || null;
  }

  protected validateBusinessInvariants(): void {
    if (!this.props.recipient) {
      throw new Error("Recipient không được để trống");
    }

    if (!this.props.content) {
      throw new Error("Content không được để trống");
    }

    if (!this.props.channels || this.props.channels.length === 0) {
      throw new Error("Phải có ít nhất một channel");
    }
  }

  protected applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case "NotificationSent":
        this.props.status = "SENT";
        this.props.sentAt = new Date();
        this.props.updatedAt = new Date();
        break;
      case "NotificationFailed":
        this.props.status = "FAILED";
        this.props.updatedAt = new Date();
        break;
      default:
        break;
    }
  }

  // ==================== Factory Method ====================

  public static create(data: {
    recipient: RecipientInfo;
    templateType: string;
    content: NotificationContent;
    channels: NotificationChannel[];
    priority?: NotificationPriority;
    metadata?: Partial<NotificationMetadata>;
  }): Notification {
    const notificationId = NotificationId.create();
    const priority = data.priority || "NORMAL";

    const metadata: NotificationMetadata = {
      source: data.metadata?.source || "notifications-service",
      correlationId: data.metadata?.correlationId,
      userId: data.metadata?.userId,
      sessionId: data.metadata?.sessionId,
      healthcareContext: data.metadata?.healthcareContext,
    };

    const props: NotificationProps = {
      notificationId,
      recipient: data.recipient,
      templateType: data.templateType,
      content: data.content,
      channels: data.channels,
      status: "PENDING",
      priority,
      sentAt: undefined,
      deliveredAt: undefined,
      readAt: undefined,
      deliveryResults: undefined,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const notification = new Notification(props, notificationId.value);
    notification.validateInvariants();

    return notification;
  }

  // ==================== Business Methods ====================

  public markAsSent(deliveryResults: DeliveryResult[]): void {
    if (this.props.status !== "PENDING") {
      throw new Error("Chỉ có thể mark as sent cho notification PENDING");
    }

    this.props.status = "SENT";
    this.props.sentAt = new Date();
    this.props.deliveryResults = deliveryResults;
    this.props.updatedAt = new Date();

    // Raise domain event
    const channels = deliveryResults.map(r => r.channel);
    const event = new NotificationSentEvent(
      this.props.notificationId.value,
      this.props.recipient.getRecipientId(),
      channels,
      this.props.metadata.healthcareContext?.patientId,
      this.props.metadata.correlationId,
      this.props.metadata.userId
    );

    this.addDomainEvent(event);
  }

  public markAsFailed(channelFailures: Array<{
    channel: string;
    reason: string;
    errorMessage: string;
    retryable: boolean;
  }>): void {
    if (this.props.status !== "PENDING") {
      throw new Error("Chỉ có thể mark as failed cho notification PENDING");
    }

    this.props.status = "FAILED";
    this.props.updatedAt = new Date();

    // Raise domain event
    const failureReason = channelFailures.map(f => `${f.channel}: ${f.errorMessage}`).join('; ');
    const event = new NotificationFailedEvent(
      {
        notificationId: this.props.notificationId.value,
        recipientId: this.props.recipient.getRecipientId(),
        channel: channelFailures.length > 0 ? channelFailures[0].channel : 'UNKNOWN',
        errorCode: 'DELIVERY_FAILED',
        errorMessage: failureReason,
        attemptCount: 1,
        timestamp: new Date()
      },
      this.props.notificationId.value
    );

    this.addDomainEvent(event);
  }

  // ==================== Queries ====================

  public isPending(): boolean {
    return this.props.status === "PENDING";
  }

  public isSent(): boolean {
    return this.props.status === "SENT";
  }

  public isFailed(): boolean {
    return this.props.status === "FAILED";
  }

  public isUrgent(): boolean {
    return this.props.priority === "URGENT";
  }

  public isRead(): boolean {
    return this.props.readAt !== undefined && this.props.readAt !== null;
  }

  public isUnread(): boolean {
    return !this.isRead();
  }

  // ==================== Required Abstract Methods ====================

  /**
   * Validate entity state (required by Entity base class)
   */
  validate(): void {
    this.validateInvariants();
  }

  /**
   * Convert to persistence format (required by Entity base class)
   * Note: This is a minimal stub. Use NotificationMapper.toPersistence() for actual persistence.
   */
  toPersistence(): { id: string; notification_id: string } {
    return {
      id: this.id,
      notification_id: this.props.notificationId.value
    };
  }
}

