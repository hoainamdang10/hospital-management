/**
 * PasswordChangedEvent Domain Event
 * Fired when a user changes their password
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';

export class PasswordChangedEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly changedBy: string,
    public readonly invalidatedSessions: boolean,
    public readonly userEmail: string,
    public readonly userRole: string
  ) {
    super(
      'PasswordChanged',
      userIdVO.value,
      'User',
      { changedBy, invalidatedSessions, email: userEmail, role: userRole },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      changedBy // userId for audit
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      changedBy: this.changedBy,
      invalidatedSessions: this.invalidatedSessions,
      email: this.userEmail,
      role: this.userRole,
      changedAt: this.occurredAt
    };
  }

  containsPHI(): boolean {
    return true; // Contains email which is PHI
  }

  getPatientId(): string | null {
    return null;
  }
}
