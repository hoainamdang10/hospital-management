/**
 * StaffSpecializationAddedEvent - Domain Event
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event Sourcing, HIPAA
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';
import { Specialization } from '../entities/Specialization';

export class StaffSpecializationAddedEvent extends DomainEvent {
  constructor(
    public readonly staffId: StaffId,
    public readonly specialization: Specialization,
    correlationId?: string,
    causationId?: string,
    requestedBy?: string
  ) {
    super(
      'StaffSpecializationAdded',
      staffId.value,
      'ProviderStaff',
      {
        staffId: staffId.value,
        specialization: specialization.toPersistence()
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
      specialization: this.specialization.toPersistence(),
      occurredAt: this.occurredAt.toISOString()
    };
  }

  public containsPHI(): boolean {
    return false; // Specialization data is not PHI
  }

  public getPatientId(): string | null {
    return null;
  }
}
