"use strict";
/**
 * Appointment No-Show Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentNoShowEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
/**
 * Appointment No-Show Event
 * Emitted when patient does not show up for scheduled appointment
 */
class AppointmentNoShowEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, appointmentDate, appointmentTime, markedBy, reason, correlationId, causationId, userId) {
        const eventData = {
            appointmentId,
            patientId,
            doctorId,
            appointmentDate,
            appointmentTime,
            markedNoShowAt: new Date(),
            markedBy,
            reason
        };
        super('AppointmentNoShow', appointmentId, 'Appointment', eventData, 1, correlationId, causationId, userId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.markedBy = markedBy;
        this.reason = reason;
    }
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData() {
        return {
            appointmentId: this.appointmentId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            appointmentDate: this.appointmentDate,
            appointmentTime: this.appointmentTime,
            markedNoShowAt: this.occurredAt,
            markedBy: this.markedBy,
            reason: this.reason
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
exports.AppointmentNoShowEvent = AppointmentNoShowEvent;
//# sourceMappingURL=AppointmentNoShowEvent.js.map