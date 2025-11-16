/**
 * Appointment Started Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface AppointmentStartedEventData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  startedAt: Date;
  startedBy: string;
}

/**
 * Appointment Started Event
 * Emitted when doctor starts the consultation/appointment
 */
export class AppointmentStartedEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly appointmentDate: string,
    public readonly appointmentTime: string,
    public readonly startedBy: string,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: AppointmentStartedEventData = {
      appointmentId,
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      startedAt: new Date(),
      startedBy
    };

    super(
      'AppointmentStarted',
      appointmentId,
      'Appointment',
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
  public getEventData(): AppointmentStartedEventData {
    return {
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      appointmentDate: this.appointmentDate,
      appointmentTime: this.appointmentTime,
      startedAt: this.occurredAt,
      startedBy: this.startedBy
    };
  }

  /**
   * Check if event contains PHI (required by DomainEvent base class)
   */
  public containsPHI(): boolean {
    return true; // Appointments contain Protected Health Information
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
  public getPayload(): AppointmentStartedEventData {
    return this.getEventData();
  }
}
