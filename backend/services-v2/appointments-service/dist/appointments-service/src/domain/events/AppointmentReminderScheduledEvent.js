"use strict";
/**
 * Appointment Reminder Scheduled Event
 * Published when a reminder is scheduled for an appointment
 * Replaces Scheduler Service events with direct reminder events
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentReminderScheduledEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
/**
 * Appointment Reminder Scheduled Event
 * Published by ReminderScheduler when a reminder is due
 * Consumed by Notifications Service to send actual notifications
 */
class AppointmentReminderScheduledEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, staffId, departmentId, appointmentScheduledAt, reminderType, hoursBeforeAppointment) {
        super('AppointmentReminderScheduled', appointmentId, 'Appointment', {
            appointmentId,
            patientId,
            staffId,
            departmentId,
            appointmentScheduledAt,
            reminderType,
            hoursBeforeAppointment,
            scheduledAt: new Date(),
        });
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.staffId = staffId;
        this.departmentId = departmentId;
        this.appointmentScheduledAt = appointmentScheduledAt;
        this.reminderType = reminderType;
        this.hoursBeforeAppointment = hoursBeforeAppointment;
    }
    static create(appointmentId, patientId, staffId, departmentId, appointmentScheduledAt, reminderType, hoursBeforeAppointment) {
        return new AppointmentReminderScheduledEvent(appointmentId, patientId, staffId, departmentId, appointmentScheduledAt, reminderType, hoursBeforeAppointment);
    }
    /**
     * Get event data
     */
    getEventData() {
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
    containsPHI() {
        return true; // Contains appointment and patient info
    }
    /**
     * Get patient ID from event
     */
    getPatientId() {
        return this.patientId;
    }
}
exports.AppointmentReminderScheduledEvent = AppointmentReminderScheduledEvent;
//# sourceMappingURL=AppointmentReminderScheduledEvent.js.map