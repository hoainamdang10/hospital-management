"use strict";
/**
 * AppointmentCompletedEvent - Domain Event
 * Published when appointment is completed
 * Subscribers: Clinical EMR Service, Billing Service, Notification Service
 * Note: consultationFee is provided as reference for billing-service to create invoice
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentCompletedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class AppointmentCompletedEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, completedAt, duration, notes, consultationFee, correlationId, causationId, userId) {
        const eventData = {
            appointmentId,
            patientId,
            doctorId,
            completedAt,
            duration,
            notes,
            consultationFee
        };
        super('AppointmentCompleted', appointmentId, 'Appointment', eventData, 1, correlationId, causationId, userId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.completedAt = completedAt;
        this.duration = duration;
        this.notes = notes;
        this.consultationFee = consultationFee;
    }
    getEventData() {
        return {
            appointmentId: this.appointmentId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            completedAt: this.completedAt,
            duration: this.duration,
            notes: this.notes,
            consultationFee: this.consultationFee
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.AppointmentCompletedEvent = AppointmentCompletedEvent;
//# sourceMappingURL=AppointmentCompletedEvent.js.map