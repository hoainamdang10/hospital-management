"use strict";
/**
 * Patient Joined Queue Event - Domain Event
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientJoinedQueueEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class PatientJoinedQueueEvent extends domain_event_1.DomainEvent {
    constructor(queueId, doctorId, patientId, appointmentId, queueNumber, priority, estimatedWaitMinutes, checkInTime, correlationId, causationId, userId) {
        const eventData = {
            queueId,
            doctorId,
            patientId,
            appointmentId,
            queueNumber,
            priority,
            estimatedWaitMinutes,
            checkInTime
        };
        super('PatientJoinedQueue', queueId, 'Queue', eventData, 1, correlationId, causationId, userId);
        this.queueId = queueId;
        this.doctorId = doctorId;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.queueNumber = queueNumber;
        this.priority = priority;
        this.estimatedWaitMinutes = estimatedWaitMinutes;
        this.checkInTime = checkInTime;
    }
    getEventData() {
        return {
            queueId: this.queueId,
            doctorId: this.doctorId,
            patientId: this.patientId,
            appointmentId: this.appointmentId,
            queueNumber: this.queueNumber,
            priority: this.priority,
            estimatedWaitMinutes: this.estimatedWaitMinutes,
            checkInTime: this.checkInTime
        };
    }
    containsPHI() {
        return true; // Queue contains patient information
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.PatientJoinedQueueEvent = PatientJoinedQueueEvent;
//# sourceMappingURL=PatientJoinedQueueEvent.js.map