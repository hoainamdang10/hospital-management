/**
 * Staff Status Changed Domain Event
 * Published when staff status changes (activate, suspend, reactivate, terminate)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { StaffStatus } from '../aggregates/ProviderStaff';

export interface StaffStatusChangedEventData {
  staffId: string;
  oldStatus: StaffStatus;
  newStatus: StaffStatus;
  reason?: string;
  changedBy: string;
  timestamp: Date;
}

export class StaffStatusChangedEvent extends DomainEvent {
  public readonly staffId: string;
  public readonly oldStatus: StaffStatus;
  public readonly newStatus: StaffStatus;
  public readonly reason?: string;
  public readonly changedBy: string;

  constructor(data: StaffStatusChangedEventData) {
    super(
      'StaffStatusChanged',
      data.staffId,
      'ProviderStaff',
      {
        staffId: data.staffId,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        reason: data.reason,
        changedBy: data.changedBy
      },
      1,
      undefined,
      undefined,
      data.changedBy
    );
    this.staffId = data.staffId;
    this.oldStatus = data.oldStatus;
    this.newStatus = data.newStatus;
    this.reason = data.reason;
    this.changedBy = data.changedBy;
  }

  public getEventData(): any {
    return {
      staffId: this.staffId,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      reason: this.reason,
      changedBy: this.changedBy,
      occurredAt: this.occurredAt.toISOString()
    };
  }

  public containsPHI(): boolean {
    return false; // Status changes don't contain PHI
  }

  public getPatientId(): string | null {
    return null; // Staff events don't have patient ID
  }
}
