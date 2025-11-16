/**
 * Notification Failed Event
 * Emitted when a notification fails to send
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface NotificationFailedEventData {
  notificationId: string;
  recipientId: string;
  channel: string;
  errorCode: string;
  errorMessage: string;
  attemptCount: number;
  timestamp: Date;
}

export class NotificationFailedEvent extends DomainEvent {
  constructor(
    public readonly eventData: NotificationFailedEventData,
    aggregateId: string
  ) {
    super(
      'notification.failed',
      aggregateId,
      'Notification',
      eventData
    );
  }

  public getEventData(): any {
    return this.eventData;
  }

  public containsPHI(): boolean {
    return false; // Notification metadata doesn't contain PHI
  }

  public getPatientId(): string | null {
    return null; // Not patient-specific
  }
}
