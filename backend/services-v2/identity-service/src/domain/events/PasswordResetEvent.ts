/**
 * PasswordResetEvent Domain Event
 * Fired when a user resets their password via reset token
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';

export class PasswordResetEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly userEmail: string,
    public readonly userRole: string,
    public readonly resetMethod: 'token' | 'admin',
    public readonly invalidatedSessions: boolean
  ) {
    super(
      'PasswordReset',
      userIdVO.value,
      'User',
      { email: userEmail, role: userRole, resetMethod, invalidatedSessions },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      userIdVO.value // userId for audit
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      email: this.userEmail,
      role: this.userRole,
      resetMethod: this.resetMethod,
      invalidatedSessions: this.invalidatedSessions,
      resetAt: this.occurredAt
    };
  }

  containsPHI(): boolean {
    return true; // Contains email which is PHI
  }

  getPatientId(): string | null {
    return null;
  }
}
