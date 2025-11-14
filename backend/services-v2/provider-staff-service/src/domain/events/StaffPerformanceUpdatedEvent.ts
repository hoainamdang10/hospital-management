/**
 * Staff Performance Updated Event - Domain Event
 * Provider/Staff Service V2
 * 
 * Published when staff performance metrics are updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from "@shared/domain/base/domain-event";

export interface StaffPerformanceUpdatedEventData {
  staffId: string;
  overallScore: number;
  reviewPeriod: {
    startDate: Date;
    endDate: Date;
  };
  reviewedBy: string;
  reviewedAt: Date;
}

/**
 * Staff Performance Updated Domain Event
 * Triggered when staff performance metrics are successfully updated
 */
export class StaffPerformanceUpdatedEvent extends DomainEvent {
  constructor(
    public readonly staffId: string,
    public readonly overallScore: number,
    public readonly reviewPeriod: { startDate: Date; endDate: Date },
    public readonly reviewedBy: string,
    public readonly reviewedAt: Date,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: StaffPerformanceUpdatedEventData = {
      staffId,
      overallScore,
      reviewPeriod,
      reviewedBy,
      reviewedAt
    };

    super(
      'StaffPerformanceUpdated',
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
  public getEventData(): StaffPerformanceUpdatedEventData {
    return {
      staffId: this.staffId,
      overallScore: this.overallScore,
      reviewPeriod: this.reviewPeriod,
      reviewedBy: this.reviewedBy,
      reviewedAt: this.reviewedAt
    };
  }

  /**
   * Check if event contains PHI (required by DomainEvent base class)
   */
  public containsPHI(): boolean {
    return true; // Staff performance contains Protected Health Information
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
  public getPayload(): StaffPerformanceUpdatedEventData {
    return this.getEventData();
  }
}
