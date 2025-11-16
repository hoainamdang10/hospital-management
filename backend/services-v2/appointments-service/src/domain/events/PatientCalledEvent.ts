/**
 * Patient Called Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PatientCalledEventData {
  queueId: string;
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  queueNumber: number;
  calledAt: Date;
}

/**
 * Patient Called Event
 * Emitted when patient is called from the waiting queue
 */
export class PatientCalledEvent extends DomainEvent {
  constructor(
    public readonly queueId: string,
    public readonly doctorId: string,
    public readonly patientId: string,
    public readonly appointmentId: string | undefined,
    public readonly queueNumber: number,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: PatientCalledEventData = {
      queueId,
      doctorId,
      patientId,
      appointmentId,
      queueNumber,
      calledAt: new Date()
    };

    super(
      'PatientCalled',
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
  public getEventData(): PatientCalledEventData {
    return {
      queueId: this.queueId,
      doctorId: this.doctorId,
      patientId: this.patientId,
      appointmentId: this.appointmentId,
      queueNumber: this.queueNumber,
      calledAt: this.occurredAt
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
  public getPayload(): PatientCalledEventData {
    return this.getEventData();
  }
}
