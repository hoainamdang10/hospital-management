/**
 * UserAccountUnlockedEvent Domain Event
 * Fired when a user account is unlocked by an administrator
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';

export class UserAccountUnlockedEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly unlockedBy: string,
    public readonly reason: string,
    public readonly userEmail: string,
    public readonly userRole: string
  ) {
    super(
      'UserAccountUnlocked',
      userIdVO.value,
      'User',
      { unlockedBy, reason, email: userEmail, role: userRole },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      unlockedBy // userId for audit
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      unlockedBy: this.unlockedBy,
      reason: this.reason,
      email: this.userEmail,
      role: this.userRole,
      unlockedAt: this.occurredAt
    };
  }

  containsPHI(): boolean {
    return true; // Contains email which is PHI
  }

  getPatientId(): string | null {
    return null;
  }
}
