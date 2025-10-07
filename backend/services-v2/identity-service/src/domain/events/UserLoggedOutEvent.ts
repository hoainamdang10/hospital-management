/**
 * User Logged Out Event
 * Triggered when a user logs out
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export class UserLoggedOutEvent extends DomainEvent {
  constructor(
    public readonly userIdValue: string, // Changed from UserId to string
    public readonly sessionId: string,
    public readonly loggedOutAt: Date
  ) {
    super(
      'UserLoggedOut',
      userIdValue,
      'User',
      { userIdValue, sessionId, loggedOutAt }
    );
  }

  getEventData() {
    return {
      userId: this.userIdValue,
      sessionId: this.sessionId,
      loggedOutAt: this.loggedOutAt
    };
  }

  containsPHI(): boolean {
    return false; // No PHI in logout event
  }

  getPatientId(): string | null {
    return null; // Not a patient-specific event
  }
}

