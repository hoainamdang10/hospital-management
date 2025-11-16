/**
 * Appointment Reminder Scheduled Event
 * Published when a reminder is scheduled for an appointment
 * Replaces Scheduler Service events with direct reminder events
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
/**
 * Appointment Reminder Scheduled Event Data
 */
export interface AppointmentReminderScheduledEventData {
    appointmentId: string;
    patientId: string;
    staffId: string;
    departmentId: string;
    appointmentScheduledAt: Date;
    reminderType: string;
    hoursBeforeAppointment: number;
    scheduledAt: Date;
}
/**
 * Appointment Reminder Scheduled Event
 * Published by ReminderScheduler when a reminder is due
 * Consumed by Notifications Service to send actual notifications
 */
export declare class AppointmentReminderScheduledEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly staffId: string;
    readonly departmentId: string;
    readonly appointmentScheduledAt: Date;
    readonly reminderType: string;
    readonly hoursBeforeAppointment: number;
    constructor(appointmentId: string, patientId: string, staffId: string, departmentId: string, appointmentScheduledAt: Date, reminderType: string, hoursBeforeAppointment: number);
    static create(appointmentId: string, patientId: string, staffId: string, departmentId: string, appointmentScheduledAt: Date, reminderType: string, hoursBeforeAppointment: number): AppointmentReminderScheduledEvent;
    /**
     * Get event data
     */
    getEventData(): AppointmentReminderScheduledEventData;
    /**
     * Check if event contains PHI (Protected Health Information)
     */
    containsPHI(): boolean;
    /**
     * Get patient ID from event
     */
    getPatientId(): string;
}
//# sourceMappingURL=AppointmentReminderScheduledEvent.d.ts.map