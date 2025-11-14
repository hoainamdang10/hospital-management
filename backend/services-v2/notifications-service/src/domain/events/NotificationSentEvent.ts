/**
 * NotificationSentEvent - Domain Event
 * Fired when a notification is successfully sent
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from "../../../../shared/domain/base/domain-event";

export interface NotificationSentEventData {
  notificationId: string;
  recipientId: string;
  channels: string[];
  sentAt: Date;
  patientId?: string;
}

export class NotificationSentEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly recipientId: string,
    public readonly channels: string[],
    public readonly patientId?: string,
    correlationId?: string,
    userId?: string
  ) {
    const eventData: NotificationSentEventData = {
      notificationId,
      recipientId,
      channels,
      sentAt: new Date(),
      patientId
    };

    super(
      'NotificationSent',
      notificationId,
      'Notification',
      eventData,
      1,
      correlationId,
      undefined,
      userId,
      {
        source: 'domain',
        priority: 'normal',
        retryable: false
      }
    );
  }

  public getEventData(): NotificationSentEventData {
    return {
      notificationId: this.notificationId,
      recipientId: this.recipientId,
      channels: this.channels,
      sentAt: this.occurredAt,
      patientId: this.patientId
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId || null;
  }
}
