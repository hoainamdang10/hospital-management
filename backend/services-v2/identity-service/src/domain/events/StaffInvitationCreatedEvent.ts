/**
 * Staff Invitation Created Event
 * Triggered when admin creates a staff invitation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export class StaffInvitationCreatedEvent extends DomainEvent {
  constructor(
    public readonly email: string,
    public readonly role: string,
    public readonly invitedBy: string,
    public readonly invitationToken: string,
    public readonly expiresAt: Date
  ) {
    super(
      'StaffInvitationCreated',
      email, // Use email as aggregate ID
      'StaffInvitation',
      { email, role, invitedBy, invitationToken, expiresAt }
    );
  }

  getEventData() {
    return {
      email: this.email,
      role: this.role,
      invitedBy: this.invitedBy,
      invitationToken: this.invitationToken,
      expiresAt: this.expiresAt
    };
  }

  containsPHI(): boolean {
    return true; // Email is PII
  }

  getPatientId(): string | null {
    return null; // Not a patient event
  }
}

