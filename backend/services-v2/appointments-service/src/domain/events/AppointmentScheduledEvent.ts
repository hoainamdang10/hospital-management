/**
 * Appointment Scheduled Event - Domain Layer
 * V3 Clean Architecture + DDD + Event-Driven Implementation
 * Follows Identity and Provider service pattern - accepts primitive values
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA, Vietnamese Healthcare Standards
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface AppointmentScheduledEventData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  type: string;
  priority: string;
  status: string;
  consultationFee: number;
  createdBy: string;
  scheduledAt: Date;
  reason?: string;
  notes?: string;
}

/**
 * Appointment Scheduled Domain Event
 * Triggered when a new appointment is successfully scheduled
 *
 * Pattern: Accepts primitive values/value objects (following Identity & Provider service pattern)
 * This allows better serialization and decoupling from aggregate structure
 */
export class AppointmentScheduledEvent extends DomainEvent {

  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly appointmentDate: string,
    public readonly appointmentTime: string,
    public readonly durationMinutes: number,
    public readonly type: string,
    public readonly priority: string,
    public readonly status: string,
    public readonly consultationFee: number,
    public readonly createdBy: string,
    public readonly reason?: string,
    public readonly notes?: string,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: AppointmentScheduledEventData = {
      appointmentId,
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      durationMinutes,
      type,
      priority,
      status,
      consultationFee,
      createdBy,
      scheduledAt: new Date(),
      reason,
      notes
    };

    super(
      'AppointmentScheduled',
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
  public getEventData(): AppointmentScheduledEventData {
    return {
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      appointmentDate: this.appointmentDate,
      appointmentTime: this.appointmentTime,
      durationMinutes: this.durationMinutes,
      type: this.type,
      priority: this.priority,
      status: this.status,
      consultationFee: this.consultationFee,
      createdBy: this.createdBy,
      scheduledAt: this.occurredAt,
      reason: this.reason,
      notes: this.notes
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
  public getPayload(): AppointmentScheduledEventData {
    return this.getEventData();
  }
}
