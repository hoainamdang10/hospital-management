/**
 * Appointment Checked-In Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface AppointmentCheckedInEventData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  checkedInAt: Date;
  priority: string;
}

/**
 * Appointment Checked-In Event
 * Emitted when patient checks in for appointment
 */
export class AppointmentCheckedInEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly checkedInAt: Date,
    public readonly priority: string,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: AppointmentCheckedInEventData = {
      appointmentId,
      patientId,
      doctorId,
      checkedInAt,
      priority
    };

    super(
      'AppointmentCheckedIn',
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
  public getEventData(): AppointmentCheckedInEventData {
    return {
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      checkedInAt: this.checkedInAt,
      priority: this.priority
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
  public getPayload(): AppointmentCheckedInEventData {
    return this.getEventData();
  }
}

