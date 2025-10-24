/**
 * StaffDepartmentAssignedEvent - Domain Event
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event Sourcing, HIPAA
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';
import { DepartmentAssignment } from '../entities/DepartmentAssignment';

export class StaffDepartmentAssignedEvent extends DomainEvent {
  constructor(
    public readonly staffId: StaffId,
    public readonly assignment: DepartmentAssignment,
    correlationId?: string,
    causationId?: string,
    requestedBy?: string
  ) {
    super(
      'StaffDepartmentAssigned',
      staffId.value,
      'ProviderStaff',
      {
        staffId: staffId.value,
        assignment: assignment.toPersistence()
      },
      1,
      correlationId,
      causationId,
      requestedBy
    );
  }

  public getEventData(): any {
    return {
      staffId: this.staffId.value,
      assignment: this.assignment.toPersistence(),
      occurredAt: this.occurredAt.toISOString()
    };
  }

  public containsPHI(): boolean {
    return false; // Department assignment is not PHI
  }

  public getPatientId(): string | null {
    return null;
  }
}
