/**
 * MFAEnabledEvent Domain Event
 * Fired when MFA is enabled for a user account
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';

export class MFAEnabledEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly method: '2fa_app' | 'sms' | 'email',
    public readonly enabledBy: string,
    public readonly userEmail: string,
    public readonly userRole: string
  ) {
    super(
      'MFAEnabled',
      userIdVO.value,
      'User',
      { method, enabledBy, email: userEmail, role: userRole },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      enabledBy // userId for audit
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      method: this.method,
      enabledBy: this.enabledBy,
      email: this.userEmail,
      role: this.userRole,
      enabledAt: this.occurredAt
    };
  }

  containsPHI(): boolean {
    return true; // Contains email which is PHI
  }

  getPatientId(): string | null {
    return null;
  }
}
