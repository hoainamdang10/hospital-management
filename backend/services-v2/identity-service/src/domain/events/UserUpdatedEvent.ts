/**
 * UserUpdatedEvent Domain Event
 * Fired when user information is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';

export interface UserFieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export class UserUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly updatedBy: string,
    public readonly updatedFields: string[],
    public readonly changes: UserFieldChange[]
  ) {
    super(
      'UserUpdated',
      userIdVO.value,
      'User',
      { updatedBy, updatedFields, changes },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      updatedBy // userId for audit
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      updatedBy: this.updatedBy,
      updatedFields: this.updatedFields,
      changes: this.changes,
      updatedAt: this.occurredAt
    };
  }

  containsPHI(): boolean {
    // May contain PHI depending on updated fields
    return this.updatedFields.some(field => 
      ['email', 'fullName', 'phoneNumber', 'citizenId', 'dateOfBirth', 'address'].includes(field)
    );
  }

  getPatientId(): string | null {
    return null;
  }
}
