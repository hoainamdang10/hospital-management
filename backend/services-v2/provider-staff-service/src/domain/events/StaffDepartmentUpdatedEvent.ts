/**
 * Staff Department Updated Event - Domain Event
 * Provider/Staff Service V2
 * 
 * Published when staff department assignment is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from "@shared/domain/base/domain-event";

export interface StaffDepartmentUpdatedEventData {
  staffId: string;
  previousDepartmentId?: string;
  newDepartmentId: string;
  assignmentType: string;
  assignedBy: string;
  assignedAt: Date;
}

/**
 * Staff Department Updated Domain Event
 * Triggered when staff department assignment is successfully updated
 */
export class StaffDepartmentUpdatedEvent extends DomainEvent {
  constructor(
    public readonly staffId: string,
    public readonly previousDepartmentId: string | undefined,
    public readonly newDepartmentId: string,
    public readonly assignmentType: string,
    public readonly assignedBy: string,
    public readonly assignedAt: Date,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: StaffDepartmentUpdatedEventData = {
      staffId,
      previousDepartmentId,
      newDepartmentId,
      assignmentType,
      assignedBy,
      assignedAt
    };

    super(
      'StaffDepartmentUpdated',
      staffId,
      'Staff',
      eventData,
      1,
      correlationId,
      causationId,
      userId
    );
  }

  /**
   * Get event data payload (required by DomainEvent base class)
   */
  public getEventData(): StaffDepartmentUpdatedEventData {
    return {
      staffId: this.staffId,
      previousDepartmentId: this.previousDepartmentId,
      newDepartmentId: this.newDepartmentId,
      assignmentType: this.assignmentType,
      assignedBy: this.assignedBy,
      assignedAt: this.assignedAt
    };
  }

  /**
   * Check if event contains PHI (required by DomainEvent base class)
   */
  public containsPHI(): boolean {
    return true; // Staff assignments contain Protected Health Information
  }

  /**
   * Get patient ID (required by DomainEvent base class)
   */
  public getPatientId(): string | null {
    return null; // This is a staff event, not patient-related
  }

  /**
   * Get payload for event publishing
   */
  public getPayload(): StaffDepartmentUpdatedEventData {
    return this.getEventData();
  }
}
