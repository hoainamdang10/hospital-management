/**
 * StaffScheduleUpdatedEvent - Domain Event
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';
import { WorkSchedule } from '../value-objects/WorkSchedule';

export class StaffScheduleUpdatedEvent extends DomainEvent {
  constructor(
    public readonly staffId: StaffId,
    public readonly newSchedule: WorkSchedule,
    correlationId?: string,
    causationId?: string,
    updatedBy?: string
  ) {
    super(
      'StaffScheduleUpdated',
      staffId.value,
      'ProviderStaff',
      {
        staffId: staffId.value,
        newSchedule: newSchedule.toPersistence()
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
      newSchedule: this.newSchedule.toPersistence(),
      occurredAt: this.occurredAt.toISOString()
    };
  }

  public containsPHI(): boolean {
    return false;
  }

  public getPatientId(): string | null {
    return null;
  }
}

