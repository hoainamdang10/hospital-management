/**
 * MFADisabledEvent Domain Event
 * Fired when MFA is disabled for a user account
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';

export class MFADisabledEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly disabledBy: string,
    public readonly userEmail: string,
    public readonly userRole: string
  ) {
    super(
      'MFADisabled',
      userIdVO.value,
      'User',
      { disabledBy, email: userEmail, role: userRole },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      disabledBy // userId for audit
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      disabledBy: this.disabledBy,
      email: this.userEmail,
      role: this.userRole,
      disabledAt: this.occurredAt
    };
  }

  containsPHI(): boolean {
    return true; // Contains email which is PHI
  }

  getPatientId(): string | null {
    return null;
  }
}
