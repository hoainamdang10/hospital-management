"use strict";
/**
 * AppointmentConfirmedEvent - Domain Event
 * Published when appointment is confirmed
 * Subscribers: Notification Service, Doctor Service
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentConfirmedEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
class AppointmentConfirmedEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, confirmedAt, confirmationMethod, correlationId, causationId, userId) {
        const eventData = {
            appointmentId,
            patientId,
            doctorId,
            confirmedAt,
            confirmationMethod
        };
        super('AppointmentConfirmed', appointmentId, 'Appointment', eventData, 1, correlationId, causationId, userId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.confirmedAt = confirmedAt;
        this.confirmationMethod = confirmationMethod;
    }
    getEventData() {
        return {
            appointmentId: this.appointmentId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            confirmedAt: this.confirmedAt,
            confirmationMethod: this.confirmationMethod
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.AppointmentConfirmedEvent = AppointmentConfirmedEvent;
//# sourceMappingURL=AppointmentConfirmedEvent.js.map