/**
 * Appointment No-Show Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface AppointmentNoShowEventData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  markedNoShowAt: Date;
  markedBy: string;
  reason?: string;
}

/**
 * Appointment No-Show Event
 * Emitted when patient does not show up for scheduled appointment
 */
export class AppointmentNoShowEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly appointmentDate: string,
    public readonly appointmentTime: string,
    public readonly markedBy: string,
    public readonly reason?: string,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: AppointmentNoShowEventData = {
      appointmentId,
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      markedNoShowAt: new Date(),
      markedBy,
      reason
    };

    super(
      'AppointmentNoShow',
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
  public getEventData(): AppointmentNoShowEventData {
    return {
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      appointmentDate: this.appointmentDate,
      appointmentTime: this.appointmentTime,
      markedNoShowAt: this.occurredAt,
      markedBy: this.markedBy,
      reason: this.reason
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
  public getPayload(): AppointmentNoShowEventData {
    return this.getEventData();
  }
}
