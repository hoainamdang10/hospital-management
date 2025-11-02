"use strict";
/**
 * AppointmentNoShowEvent - Domain Event
 * Published when a patient doesn't show up for their appointment
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentNoShowEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
/**
 * Appointment No-Show Event
 * Triggered when a patient doesn't show up for their scheduled appointment
 *
 * Subscribers:
 * - Notification Service (send no-show notification)
 * - Billing Service (apply no-show fee if applicable)
 * - Identity Service (track patient reliability)
 */
class AppointmentNoShowEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, scheduledDate, scheduledTime, markedAt) {
        super('AppointmentNoShow', appointmentId, 'Appointment', {
            patientId,
            doctorId,
            scheduledDate,
            scheduledTime,
            markedAt
        }, 1, undefined, undefined, patientId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.scheduledDate = scheduledDate;
        this.scheduledTime = scheduledTime;
        this.markedAt = markedAt;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            doctorId: this.doctorId,
            scheduledDate: this.scheduledDate,
            scheduledTime: this.scheduledTime,
            markedAt: this.markedAt
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.AppointmentNoShowEvent = AppointmentNoShowEvent;
//# sourceMappingURL=AppointmentNoShowEvent.js.map