/**
 * UserDeactivatedEvent Domain Event
 * Fired when a user account is deactivated (soft delete via isActive flag)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';

export class UserDeactivatedEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly deactivatedBy: string,
    public readonly reason: string,
    public readonly userEmail: string,
    public readonly userRole: string
  ) {
    super(
      'UserDeactivated',
      userIdVO.value,
      'User',
      { deactivatedBy, reason, email: userEmail, role: userRole },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      deactivatedBy // userId for audit
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      deactivatedBy: this.deactivatedBy,
      reason: this.reason,
      email: this.userEmail,
      role: this.userRole,
      deactivatedAt: this.occurredAt
    };
  }

  containsPHI(): boolean {
    return true; // Contains email which is PHI
  }

  getPatientId(): string | null {
    return null;
  }
}
