/**
 * User Activated Event
 * Triggered when a user's email is verified and account is activated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export class UserActivatedEvent extends DomainEvent {
  constructor(
    public readonly userIdValue: string, // Changed from UserId to string
    public readonly emailValue: string, // Changed from Email to string
    public readonly fullNameValue: string, // Full name from user registration
    public readonly activatedAt: Date
  ) {
    super(
      'UserActivated',
      userIdValue,
      'User',
      { userIdValue, emailValue, fullNameValue, activatedAt }
    );
  }

  getEventData() {
    return {
      userId: this.userIdValue,
      email: this.emailValue,
      fullName: this.fullNameValue,
      activatedAt: this.activatedAt
    };
  }

  containsPHI(): boolean {
    return true; // Email is considered PII
  }

  getPatientId(): string | null {
    return null; // Not necessarily a patient
  }
}

