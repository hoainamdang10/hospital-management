/**
 * UserDeletedEvent Domain Event
 * Fired when a user is deleted (soft or hard delete)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';

export class UserDeletedEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly deletedBy: string,
    public readonly deletionType: 'soft' | 'hard',
    public readonly reason: string,
    public readonly userEmail: string,
    public readonly userRole: string
  ) {
    super(
      'UserDeleted',
      userIdVO.value,
      'User',
      { deletedBy, deletionType, reason, email: userEmail, role: userRole },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      deletedBy // userId for audit
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      deletedBy: this.deletedBy,
      deletionType: this.deletionType,
      reason: this.reason,
      email: this.userEmail,
      role: this.userRole,
      deletedAt: this.occurredAt
    };
  }

  containsPHI(): boolean {
    return true; // Contains email which is PHI
  }

  getPatientId(): string | null {
    return null;
  }
}
