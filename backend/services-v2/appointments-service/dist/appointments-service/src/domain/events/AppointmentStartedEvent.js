"use strict";
/**
 * Appointment Started Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentStartedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
/**
 * Appointment Started Event
 * Emitted when doctor starts the appointment
 */
class AppointmentStartedEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, startedAt, roomId, correlationId, causationId, userId) {
        const eventData = {
            appointmentId,
            patientId,
            doctorId,
            startedAt,
            roomId
        };
        super('AppointmentStarted', appointmentId, 'Appointment', eventData, 1, correlationId, causationId, userId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.startedAt = startedAt;
        this.roomId = roomId;
    }
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData() {
        return {
            appointmentId: this.appointmentId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            startedAt: this.startedAt,
            roomId: this.roomId
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
exports.AppointmentStartedEvent = AppointmentStartedEvent;
//# sourceMappingURL=AppointmentStartedEvent.js.map