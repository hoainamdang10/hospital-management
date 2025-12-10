/**
 * Appointment Confirmed Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface AppointmentConfirmedEventData {
  appointmentId: string;
  patientId: string;
  patientName?: string; //  ADDED for notifications
  doctorId: string;
  doctorName?: string; //  ADDED for notifications
  departmentId?: string; //  ADDED for notifications
  departmentName?: string; //  ADDED for notifications
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes?: number; //  ADDED for notifications
  consultationFee?: number; //  ADDED for notifications
  confirmedAt: Date;
  confirmedBy: string;
  confirmationMethod?: 'sms' | 'email' | 'phone' | 'manual' | 'payment_completed';
}

/**
 * Appointment Confirmed Event
 * Emitted when patient confirms attendance for scheduled appointment
 */
export class AppointmentConfirmedEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly appointmentDate: string,
    public readonly appointmentTime: string,
    public readonly confirmedBy: string,
    public readonly confirmationMethod?: 'sms' | 'email' | 'phone' | 'manual' | 'payment_completed',
    public readonly patientName?: string,
    public readonly doctorName?: string,
    public readonly departmentId?: string,
    public readonly departmentName?: string,
    public readonly durationMinutes?: number,
    public readonly consultationFee?: number,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: AppointmentConfirmedEventData = {
      appointmentId,
      patientId,
      patientName,
      doctorId,
      doctorName,
      departmentId,
      departmentName,
      appointmentDate,
      appointmentTime,
      durationMinutes,
      consultationFee,
      confirmedAt: new Date(),
      confirmedBy,
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

  /**
   * Get event data payload (required by DomainEvent base class)
   */
  public getEventData(): AppointmentConfirmedEventData {
    return {
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      patientName: this.patientName,
      doctorId: this.doctorId,
      doctorName: this.doctorName,
      departmentId: this.departmentId,
      departmentName: this.departmentName,
      appointmentDate: this.appointmentDate,
      appointmentTime: this.appointmentTime,
      durationMinutes: this.durationMinutes,
      consultationFee: this.consultationFee,
      confirmedAt: this.occurredAt,
      confirmedBy: this.confirmedBy,
      confirmationMethod: this.confirmationMethod
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
  public getPayload(): AppointmentConfirmedEventData {
    return this.getEventData();
  }
}
