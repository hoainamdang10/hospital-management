/**
 * Appointment Reminder Scheduled Event
 * Published when a reminder is scheduled for an appointment
 * Replaces Scheduler Service events with direct reminder events
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

/**
 * Appointment Reminder Scheduled Event Data
 */
export interface AppointmentReminderScheduledEventData {
  appointmentId: string;
  patientId: string;
  staffId: string;
  departmentId: string;
  appointmentScheduledAt: Date;
  reminderType: string; // 'reminder-24h', 'reminder-2h', 'reminder-30min'
  hoursBeforeAppointment: number;
  scheduledAt: Date;
}

/**
 * Appointment Reminder Scheduled Event
 * Published by ReminderScheduler when a reminder is due
 * Consumed by Notifications Service to send actual notifications
 */
export class AppointmentReminderScheduledEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly staffId: string,
    public readonly departmentId: string,
    public readonly appointmentScheduledAt: Date,
    public readonly reminderType: string,
    public readonly hoursBeforeAppointment: number
  ) {
    super(
      'AppointmentReminderScheduled',
      appointmentId,
      'Appointment',
      {
        appointmentId,
        patientId,
        staffId,
        departmentId,
        appointmentScheduledAt,
        reminderType,
        hoursBeforeAppointment,
        scheduledAt: new Date(),
      } as AppointmentReminderScheduledEventData
    );
  }

  static create(
    appointmentId: string,
    patientId: string,
    staffId: string,
    departmentId: string,
    appointmentScheduledAt: Date,
    reminderType: string,
    hoursBeforeAppointment: number
  ): AppointmentReminderScheduledEvent {
    return new AppointmentReminderScheduledEvent(
      appointmentId,
      patientId,
      staffId,
      departmentId,
      appointmentScheduledAt,
      reminderType,
      hoursBeforeAppointment
    );
  }

  /**
   * Get event data
   */
  getEventData(): AppointmentReminderScheduledEventData {
    return {
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      staffId: this.staffId,
      departmentId: this.departmentId,
      appointmentScheduledAt: this.appointmentScheduledAt,
      reminderType: this.reminderType,
      hoursBeforeAppointment: this.hoursBeforeAppointment,
      scheduledAt: this.occurredAt,
    };
  }

  /**
   * Check if event contains PHI (Protected Health Information)
   */
  containsPHI(): boolean {
    return true; // Contains appointment and patient info
  }

  /**
   * Get patient ID from event
   */
  getPatientId(): string {
    return this.patientId;
  }
}
