/**
 * StaffUpdatedEvent - Domain Event
 * Published when staff information is updated
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';

export class StaffUpdatedEvent extends DomainEvent {
  constructor(
    public readonly staffId: StaffId,
    public readonly updatedFields: string[],
    public readonly updatedData: Record<string, any>,
    correlationId?: string,
    causationId?: string,
    updatedBy?: string
  ) {
    super(
      'StaffUpdated',
      staffId.value,
      'ProviderStaff',
      {
        staffId: staffId.value,
        updatedFields,
        updatedData
      },
      1,
      correlationId,
      causationId,
      updatedBy
    );
  }

  public getEventData(): any {
    return {
      staffId: this.staffId.value,
      updatedFields: this.updatedFields,
      updatedData: this.updatedData,
      occurredAt: this.occurredAt.toISOString()
    };
  }

  public containsPHI(): boolean {
    // May contain PHI if personal info was updated
    return this.updatedFields.includes('personalInfo');
  }

  public getPatientId(): string | null {
    return null; // Staff events don't have patient ID
  }
}

