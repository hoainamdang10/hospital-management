/**
 * Staff Employment Status Updated Domain Event
 * Published when staff employment type changes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { EmploymentType } from '../aggregates/ProviderStaff';

export interface StaffEmploymentStatusUpdatedEventData {
  staffId: string;
  oldEmploymentType: EmploymentType;
  newEmploymentType: EmploymentType;
  contractEndDate?: Date;
  updatedBy: string;
  timestamp: Date;
}

export class StaffEmploymentStatusUpdatedEvent extends DomainEvent {
  public readonly staffId: string;
  public readonly oldEmploymentType: EmploymentType;
  public readonly newEmploymentType: EmploymentType;
  public readonly contractEndDate?: Date;
  public readonly updatedBy: string;

  constructor(data: StaffEmploymentStatusUpdatedEventData) {
    super(
      'StaffEmploymentStatusUpdated',
      data.staffId,
      'ProviderStaff',
      {
        staffId: data.staffId,
        oldEmploymentType: data.oldEmploymentType,
        newEmploymentType: data.newEmploymentType,
        contractEndDate: data.contractEndDate?.toISOString(),
        updatedBy: data.updatedBy
      },
      1,
      undefined,
      undefined,
      data.updatedBy
    );
    this.staffId = data.staffId;
    this.oldEmploymentType = data.oldEmploymentType;
    this.newEmploymentType = data.newEmploymentType;
    this.contractEndDate = data.contractEndDate;
    this.updatedBy = data.updatedBy;
  }

  public getEventData(): any {
    return {
      staffId: this.staffId,
      oldEmploymentType: this.oldEmploymentType,
      newEmploymentType: this.newEmploymentType,
      contractEndDate: this.contractEndDate?.toISOString(),
      updatedBy: this.updatedBy,
      occurredAt: this.occurredAt.toISOString()
    };
  }

  public containsPHI(): boolean {
    return false; // Employment status doesn't contain PHI
  }

  public getPatientId(): string | null {
    return null; // Staff events don't have patient ID
  }
}
