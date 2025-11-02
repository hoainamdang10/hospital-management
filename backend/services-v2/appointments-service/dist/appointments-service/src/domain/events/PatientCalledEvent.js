"use strict";
/**
 * Patient Called Event - Domain Event
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientCalledEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class PatientCalledEvent extends domain_event_1.DomainEvent {
    constructor(queueId, doctorId, patientId, appointmentId, queueNumber, calledTime, calledBy, correlationId, causationId, userId) {
        const eventData = {
            queueId,
            doctorId,
            patientId,
            appointmentId,
            queueNumber,
            calledTime,
            calledBy
        };
        super('PatientCalled', queueId, 'Queue', eventData, 1, correlationId, causationId, userId);
        this.queueId = queueId;
        this.doctorId = doctorId;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.queueNumber = queueNumber;
        this.calledTime = calledTime;
        this.calledBy = calledBy;
    }
    getEventData() {
        return {
            queueId: this.queueId,
            doctorId: this.doctorId,
            patientId: this.patientId,
            appointmentId: this.appointmentId,
            queueNumber: this.queueNumber,
            calledTime: this.calledTime,
            calledBy: this.calledBy
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.PatientCalledEvent = PatientCalledEvent;
//# sourceMappingURL=PatientCalledEvent.js.map