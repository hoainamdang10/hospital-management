/**
 * Patient Joined Queue Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PatientJoinedQueueEventData {
  queueId: string;
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  queueNumber: number;
  priority: string;
  joinedAt: Date;
}

/**
 * Patient Joined Queue Event
 * Emitted when patient joins the waiting queue
 */
export class PatientJoinedQueueEvent extends DomainEvent {
  constructor(
    public readonly queueId: string,
    public readonly doctorId: string,
    public readonly patientId: string,
    public readonly appointmentId: string | undefined,
    public readonly queueNumber: number,
    public readonly priority: string,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: PatientJoinedQueueEventData = {
      queueId,
      doctorId,
      patientId,
      appointmentId,
      queueNumber,
      priority,
      joinedAt: new Date()
    };

    super(
      'PatientJoinedQueue',
      queueId,
      'Queue',
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
  public getEventData(): PatientJoinedQueueEventData {
    return {
      queueId: this.queueId,
      doctorId: this.doctorId,
      patientId: this.patientId,
      appointmentId: this.appointmentId,
      queueNumber: this.queueNumber,
      priority: this.priority,
      joinedAt: this.occurredAt
    };
  }

  /**
   * Check if event contains PHI (required by DomainEvent base class)
   */
  public containsPHI(): boolean {
    return true; // Queue contains Protected Health Information
  }

  /**
   * Get patient ID (required for healthcare events)
   */
  public getPatientId(): string | null {
    return this.patientId;
  }

  /**
   * Get payload for event publishing
   */
  public getPayload(): PatientJoinedQueueEventData {
    return this.getEventData();
  }
}
