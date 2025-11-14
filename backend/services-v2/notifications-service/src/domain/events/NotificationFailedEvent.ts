/**
 * NotificationFailedEvent - Domain Event
 * Fired when a notification fails to send
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from "../../../../shared/domain/base/domain-event";

export interface NotificationFailedEventData {
  notificationId: string;
  recipientId: string;
  failureReason: string;
  failedAt: Date;
  patientId?: string;
}

export class NotificationFailedEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly recipientId: string,
    public readonly failureReason: string,
    public readonly patientId?: string,
    correlationId?: string,
    userId?: string
  ) {
    const eventData: NotificationFailedEventData = {
      notificationId,
      recipientId,
      failureReason,
      failedAt: new Date(),
      patientId
    };

    super(
      'NotificationFailed',
      notificationId,
      'Notification',
      eventData,
      1,
      correlationId,
      undefined,
      userId,
      {
        source: 'domain',
        priority: 'high',
        retryable: true
      }
    );
  }

  public getEventData(): NotificationFailedEventData {
    return {
      notificationId: this.notificationId,
      recipientId: this.recipientId,
      failureReason: this.failureReason,
      failedAt: this.occurredAt,
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
