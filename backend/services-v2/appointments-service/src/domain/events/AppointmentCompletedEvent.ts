/**
 * AppointmentCompletedEvent - Domain Event
 * Published when appointment is completed
 * Subscribers: Clinical EMR Service, Billing Service, Notification Service
 * Note: consultationFee is provided as reference for billing-service to create invoice
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface AppointmentCompletedEventData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  completedAt: Date;
  duration: number;
  notes?: string;
  consultationFee?: number;
}

export class AppointmentCompletedEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly completedAt: Date,
    public readonly duration: number,
    public readonly notes?: string,
    public readonly consultationFee?: number,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: AppointmentCompletedEventData = {
      appointmentId,
      patientId,
      doctorId,
      completedAt,
      duration,
      notes,
      consultationFee
    };

    super(
      'AppointmentCompleted',
      appointmentId,
      'Appointment',
      eventData,
      1,
      correlationId,
      causationId,
      userId
    );
  }

  public getEventData(): AppointmentCompletedEventData {
    return {
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      completedAt: this.completedAt,
      duration: this.duration,
      notes: this.notes,
      consultationFee: this.consultationFee
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }
}
