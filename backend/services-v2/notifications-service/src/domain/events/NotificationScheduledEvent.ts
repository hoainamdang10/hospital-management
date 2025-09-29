/**
 * NotificationScheduledEvent - Domain Event
 * Fired when a notification is scheduled for delivery
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '../../../shared/domain/events/DomainEvent';
import { NotificationId } from '../value-objects/NotificationId';

export interface NotificationScheduledEventData {
  notificationId: string;
  recipientId: string;
  recipientType: string;
  templateType: string;
  channels: string[];
  scheduledAt: Date;
  priority: string;
  isUrgent: boolean;
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
  };
}

export class NotificationScheduledEvent extends DomainEvent<NotificationScheduledEventData> {
  public static readonly EVENT_TYPE = 'notification.scheduled';

  constructor(data: NotificationScheduledEventData) {
    super(
      NotificationScheduledEvent.EVENT_TYPE,
      data,
      new Date(),
      `notification-${data.notificationId}`
    );
  }

  /**
   * Create event from notification data
   */
  public static create(
    notificationId: NotificationId,
    recipientId: string,
    recipientType: string,
    templateType: string,
    channels: string[],
    scheduledAt: Date,
    priority: string,
    options: {
      isUrgent?: boolean;
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
      };
    } = {}
  ): NotificationScheduledEvent {
    const data: NotificationScheduledEventData = {
      notificationId: notificationId.getValue(),
      recipientId,
      recipientType,
      templateType,
      channels,
      scheduledAt,
      priority,
      isUrgent: options.isUrgent || false,
      healthcareContext: options.healthcareContext,
      metadata: {
        source: options.metadata?.source || 'notifications-service',
        correlationId: options.metadata?.correlationId,
        userId: options.metadata?.userId,
        sessionId: options.metadata?.sessionId
      }
    };

    return new NotificationScheduledEvent(data);
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
   * Get delivery channels
   */
  public getChannels(): string[] {
    return [...this.data.channels];
  }

  /**
   * Get scheduled delivery time
   */
  public getScheduledAt(): Date {
    return new Date(this.data.scheduledAt);
  }

  /**
   * Get priority
   */
  public getPriority(): string {
    return this.data.priority;
  }

  /**
   * Check if notification is urgent
   */
  public isUrgent(): boolean {
    return this.data.isUrgent;
  }

  /**
   * Get healthcare context
   */
  public getHealthcareContext(): any {
    return this.data.healthcareContext ? { ...this.data.healthcareContext } : undefined;
  }

  /**
   * Get patient ID from healthcare context
   */
  public getPatientId(): string | undefined {
    return this.data.healthcareContext?.patientId;
  }

  /**
   * Get doctor ID from healthcare context
   */
  public getDoctorId(): string | undefined {
    return this.data.healthcareContext?.doctorId;
  }

  /**
   * Get appointment ID from healthcare context
   */
  public getAppointmentId(): string | undefined {
    return this.data.healthcareContext?.appointmentId;
  }

  /**
   * Get medical record ID from healthcare context
   */
  public getMedicalRecordId(): string | undefined {
    return this.data.healthcareContext?.medicalRecordId;
  }

  /**
   * Get event source
   */
  public getSource(): string {
    return this.data.metadata.source;
  }

  /**
   * Get correlation ID for tracing
   */
  public getCorrelationId(): string | undefined {
    return this.data.metadata.correlationId;
  }

  /**
   * Get user ID who triggered the notification
   */
  public getUserId(): string | undefined {
    return this.data.metadata.userId;
  }

  /**
   * Get session ID
   */
  public getSessionId(): string | undefined {
    return this.data.metadata.sessionId;
  }

  /**
   * Check if this is a healthcare-related notification
   */
  public isHealthcareNotification(): boolean {
    return !!this.data.healthcareContext && (
      !!this.data.healthcareContext.patientId ||
      !!this.data.healthcareContext.doctorId ||
      !!this.data.healthcareContext.appointmentId ||
      !!this.data.healthcareContext.medicalRecordId
    );
  }

  /**
   * Check if notification should be delivered immediately
   */
  public shouldDeliverImmediately(): boolean {
    const now = new Date();
    const scheduledTime = this.getScheduledAt();
    
    // Deliver immediately if scheduled time is in the past or within 1 minute
    return scheduledTime <= now || (scheduledTime.getTime() - now.getTime()) <= 60000;
  }

  /**
   * Get delay until scheduled delivery in milliseconds
   */
  public getDeliveryDelay(): number {
    const now = new Date();
    const scheduledTime = this.getScheduledAt();
    
    return Math.max(0, scheduledTime.getTime() - now.getTime());
  }

  /**
   * Check if notification is for multiple channels
   */
  public isMultiChannel(): boolean {
    return this.data.channels.length > 1;
  }

  /**
   * Check if notification includes SMS channel
   */
  public includesSMS(): boolean {
    return this.data.channels.includes('SMS');
  }

  /**
   * Check if notification includes email channel
   */
  public includesEmail(): boolean {
    return this.data.channels.includes('EMAIL');
  }

  /**
   * Check if notification includes push channel
   */
  public includesPush(): boolean {
    return this.data.channels.includes('PUSH');
  }

  /**
   * Get Vietnamese description of the event
   */
  public getVietnameseDescription(): string {
    const channelNames: Record<string, string> = {
      'EMAIL': 'Email',
      'SMS': 'SMS',
      'PUSH': 'Thông báo đẩy',
      'IN_APP': 'Trong ứng dụng',
      'VOICE': 'Cuộc gọi'
    };

    const channelList = this.data.channels
      .map(channel => channelNames[channel] || channel)
      .join(', ');

    const urgentText = this.isUrgent() ? ' (Khẩn cấp)' : '';
    const scheduleText = this.shouldDeliverImmediately() 
      ? 'ngay lập tức' 
      : `lúc ${this.getScheduledAt().toLocaleString('vi-VN')}`;

    return `Đã lên lịch gửi thông báo ${this.data.templateType}${urgentText} cho ${this.data.recipientType} qua ${channelList} ${scheduleText}`;
  }

  /**
   * Create integration event for external systems
   */
  public toIntegrationEvent(): object {
    return {
      eventType: 'NotificationScheduled',
      eventId: this.eventId,
      timestamp: this.timestamp,
      data: {
        notificationId: this.data.notificationId,
        recipientId: this.data.recipientId,
        recipientType: this.data.recipientType,
        templateType: this.data.templateType,
        channels: this.data.channels,
        scheduledAt: this.data.scheduledAt,
        priority: this.data.priority,
        isUrgent: this.data.isUrgent,
        healthcareContext: this.data.healthcareContext,
        source: this.data.metadata.source,
        correlationId: this.data.metadata.correlationId
      }
    };
  }

  /**
   * Create audit log entry
   */
  public toAuditLog(): object {
    return {
      action: 'NOTIFICATION_SCHEDULED',
      entityType: 'Notification',
      entityId: this.data.notificationId,
      userId: this.data.metadata.userId,
      sessionId: this.data.metadata.sessionId,
      timestamp: this.timestamp,
      details: {
        recipientId: this.data.recipientId,
        recipientType: this.data.recipientType,
        templateType: this.data.templateType,
        channels: this.data.channels,
        scheduledAt: this.data.scheduledAt,
        priority: this.data.priority,
        isUrgent: this.data.isUrgent,
        healthcareContext: this.data.healthcareContext
      },
      correlationId: this.data.metadata.correlationId
    };
  }

  /**
   * Validate event data
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.data.notificationId) {
      errors.push('Notification ID is required');
    }

    if (!this.data.recipientId) {
      errors.push('Recipient ID is required');
    }

    if (!this.data.recipientType) {
      errors.push('Recipient type is required');
    }

    if (!this.data.templateType) {
      errors.push('Template type is required');
    }

    if (!this.data.channels || this.data.channels.length === 0) {
      errors.push('At least one delivery channel is required');
    }

    if (!this.data.scheduledAt) {
      errors.push('Scheduled delivery time is required');
    }

    if (!this.data.priority) {
      errors.push('Priority is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * String representation
   */
  public toString(): string {
    return `NotificationScheduledEvent(${this.data.notificationId}, ${this.data.recipientType}, ${this.data.channels.join(',')})`;
  }
}
