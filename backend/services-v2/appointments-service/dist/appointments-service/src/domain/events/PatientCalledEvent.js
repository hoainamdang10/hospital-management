"use strict";
/**
 * Patient Called Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientCalledEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
/**
 * Patient Called Event
 * Emitted when patient is called from the waiting queue
 */
class PatientCalledEvent extends domain_event_1.DomainEvent {
    constructor(queueId, doctorId, patientId, appointmentId, queueNumber, correlationId, causationId, userId) {
        const eventData = {
            queueId,
            doctorId,
            patientId,
            appointmentId,
            queueNumber,
            calledAt: new Date()
        };
        super('PatientCalled', queueId, 'Queue', eventData, 1, correlationId, causationId, userId);
        this.queueId = queueId;
        this.doctorId = doctorId;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.queueNumber = queueNumber;
    }
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData() {
        return {
            queueId: this.queueId,
            doctorId: this.doctorId,
            patientId: this.patientId,
            appointmentId: this.appointmentId,
            queueNumber: this.queueNumber,
            calledAt: this.occurredAt
        };
    }
    /**
     * Check if event contains PHI (required by DomainEvent base class)
     */
    containsPHI() {
        return true; // Queue contains Protected Health Information
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
exports.PatientCalledEvent = PatientCalledEvent;
//# sourceMappingURL=PatientCalledEvent.js.map