"use strict";
/**
 * Appointment Checked-In Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentCheckedInEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
/**
 * Appointment Checked-In Event
 * Emitted when patient checks in for appointment
 */
class AppointmentCheckedInEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, checkedInAt, priority, correlationId, causationId, userId) {
        const eventData = {
            appointmentId,
            patientId,
            doctorId,
            checkedInAt,
            priority
        };
        super('AppointmentCheckedIn', appointmentId, 'Appointment', eventData, 1, correlationId, causationId, userId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.checkedInAt = checkedInAt;
        this.priority = priority;
    }
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData() {
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
    containsPHI() {
        return true; // Appointments contain Protected Health Information
    }
    /**
     * Get patient ID (required for healthcare events)
     */
    getPatientId() {
        return this.patientId;
    }
    /**
     * Get payload for event publishing
     */
    getPayload() {
        return this.getEventData();
    }
}
exports.AppointmentCheckedInEvent = AppointmentCheckedInEvent;
//# sourceMappingURL=AppointmentCheckedInEvent.js.map