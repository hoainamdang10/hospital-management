"use strict";
/**
 * Patient Joined Queue Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientJoinedQueueEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
/**
 * Patient Joined Queue Event
 * Emitted when patient joins the waiting queue
 */
class PatientJoinedQueueEvent extends domain_event_1.DomainEvent {
    constructor(queueId, doctorId, patientId, appointmentId, queueNumber, priority, correlationId, causationId, userId) {
        const eventData = {
            queueId,
            doctorId,
            patientId,
            appointmentId,
            queueNumber,
            priority,
            joinedAt: new Date()
        };
        super('PatientJoinedQueue', queueId, 'Queue', eventData, 1, correlationId, causationId, userId);
        this.queueId = queueId;
        this.doctorId = doctorId;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.queueNumber = queueNumber;
        this.priority = priority;
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
            priority: this.priority,
            joinedAt: this.occurredAt
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
exports.PatientJoinedQueueEvent = PatientJoinedQueueEvent;
//# sourceMappingURL=PatientJoinedQueueEvent.js.map