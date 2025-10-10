/**
 * UserRoleChangedEvent Domain Event
 * Fired when a user's role is changed
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';
import { HealthcareRole } from '../entities/HealthcareRole';

export class UserRoleChangedEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly oldRole: HealthcareRole,
    public readonly newRole: HealthcareRole,
    public readonly changedBy: string
  ) {
    super(
      'UserRoleChanged',
      userIdVO.value,
      'User',
      { oldRole: oldRole.type, newRole: newRole.type, changedBy },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      userIdVO.value // userId as string for base class
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      oldRole: this.oldRole.type,
      newRole: this.newRole.type,
      changedBy: this.changedBy
    };
  }

  containsPHI(): boolean {
    return false;
  }

  getPatientId(): string | null {
    return null;
  }
}
