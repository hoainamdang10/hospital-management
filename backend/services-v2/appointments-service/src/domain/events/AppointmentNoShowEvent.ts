/**
 * AppointmentNoShowEvent - Domain Event
 * Published when a patient doesn't show up for their appointment
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

/**
 * Appointment No-Show Event
 * Triggered when a patient doesn't show up for their scheduled appointment
 * 
 * Subscribers:
 * - Notification Service (send no-show notification)
 * - Billing Service (apply no-show fee if applicable)
 * - Identity Service (track patient reliability)
 */
export class AppointmentNoShowEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly scheduledDate: Date,
    public readonly scheduledTime: string,
    public readonly markedAt: Date
  ) {
    super(
      'AppointmentNoShow',
      appointmentId,
      'Appointment',
      {
        patientId,
        doctorId,
        scheduledDate,
        scheduledTime,
        markedAt
      },
      1,
      undefined,
      undefined,
      patientId
    );
  }

  override getEventData(): any {
    return {
      patientId: this.patientId,
      doctorId: this.doctorId,
      scheduledDate: this.scheduledDate,
      scheduledTime: this.scheduledTime,
      markedAt: this.markedAt
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

