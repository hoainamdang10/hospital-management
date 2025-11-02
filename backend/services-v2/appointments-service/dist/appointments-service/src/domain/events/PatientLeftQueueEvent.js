"use strict";
/**
 * Patient Left Queue Event - Domain Event
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientLeftQueueEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class PatientLeftQueueEvent extends domain_event_1.DomainEvent {
    constructor(queueId, doctorId, patientId, appointmentId, queueNumber, reason, removedBy, leftTime, correlationId, causationId, userId) {
        const eventData = {
            queueId,
            doctorId,
            patientId,
            appointmentId,
            queueNumber,
            reason,
            removedBy,
            leftTime
        };
        super('PatientLeftQueue', queueId, 'Queue', eventData, 1, correlationId, causationId, userId);
        this.queueId = queueId;
        this.doctorId = doctorId;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.queueNumber = queueNumber;
        this.reason = reason;
        this.removedBy = removedBy;
        this.leftTime = leftTime;
    }
    getEventData() {
        return {
            queueId: this.queueId,
            doctorId: this.doctorId,
            patientId: this.patientId,
            appointmentId: this.appointmentId,
            queueNumber: this.queueNumber,
            reason: this.reason,
            removedBy: this.removedBy,
            leftTime: this.leftTime
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.PatientLeftQueueEvent = PatientLeftQueueEvent;
//# sourceMappingURL=PatientLeftQueueEvent.js.map