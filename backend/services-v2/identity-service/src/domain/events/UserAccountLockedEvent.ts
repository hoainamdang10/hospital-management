/**
 * UserAccountLockedEvent Domain Event
 * Fired when a user account is locked by an administrator
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';

export class UserAccountLockedEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly lockedBy: string,
    public readonly reason: string,
    public readonly terminatedSessions: boolean,
    public readonly userEmail: string,
    public readonly userRole: string
  ) {
    super(
      'UserAccountLocked',
      userIdVO.value,
      'User',
      { lockedBy, reason, terminatedSessions, email: userEmail, role: userRole },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      lockedBy // userId for audit
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      lockedBy: this.lockedBy,
      reason: this.reason,
      terminatedSessions: this.terminatedSessions,
      email: this.userEmail,
      role: this.userRole,
      lockedAt: this.occurredAt
    };
  }

  containsPHI(): boolean {
    return true; // Contains email which is PHI
  }

  getPatientId(): string | null {
    return null;
  }
}
