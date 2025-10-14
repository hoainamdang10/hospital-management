/**
 * StaffRegisteredEvent
 * Domain event fired when a new staff member is registered
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';

export class StaffRegisteredEvent extends DomainEvent {
  constructor(
    public readonly staffIdVO: StaffId,
    public readonly staffType: string,
    public readonly fullName: string
  ) {
    super(
      'StaffRegistered',
      staffIdVO.value,
      'ProviderStaff',
      { staffType, fullName },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      staffIdVO.value // userId as string for base class
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      staffId: this.staffIdVO.value,
      staffType: this.staffType,
      fullName: this.fullName
    };
  }

  containsPHI(): boolean {
    return true; // Contains personal information
  }

  getPatientId(): string | null {
    return null; // Staff is not a patient
  }
}

