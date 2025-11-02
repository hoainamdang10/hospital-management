/**
 * AppointmentConfirmedEvent - Domain Event
 * Published when appointment is confirmed
 * Subscribers: Notification Service, Doctor Service
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface AppointmentConfirmedEventData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  confirmedAt: Date;
  confirmationMethod: string;
}

export class AppointmentConfirmedEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly confirmedAt: Date,
    public readonly confirmationMethod: string,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: AppointmentConfirmedEventData = {
      appointmentId,
      patientId,
      doctorId,
      confirmedAt,
      confirmationMethod
    };

    super(
      'AppointmentConfirmed',
      appointmentId,
      'Appointment',
      eventData,
      1,
      correlationId,
      causationId,
      userId
    );
  }

  public getEventData(): AppointmentConfirmedEventData {
    return {
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      confirmedAt: this.confirmedAt,
      confirmationMethod: this.confirmationMethod
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }
}
