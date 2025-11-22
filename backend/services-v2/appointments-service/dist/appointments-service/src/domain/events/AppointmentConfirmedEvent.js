"use strict";
/**
 * Appointment Confirmed Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentConfirmedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
/**
 * Appointment Confirmed Event
 * Emitted when patient confirms attendance for scheduled appointment
 */
class AppointmentConfirmedEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, appointmentDate, appointmentTime, confirmedBy, confirmationMethod, patientName, doctorName, departmentId, departmentName, durationMinutes, consultationFee, correlationId, causationId, userId) {
        const eventData = {
            appointmentId,
            patientId,
            patientName,
            doctorId,
            doctorName,
            departmentId,
            departmentName,
            appointmentDate,
            appointmentTime,
            durationMinutes,
            consultationFee,
            confirmedAt: new Date(),
            confirmedBy,
            confirmationMethod
        };
        super('AppointmentConfirmed', appointmentId, 'Appointment', eventData, 1, correlationId, causationId, userId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.confirmedBy = confirmedBy;
        this.confirmationMethod = confirmationMethod;
        this.patientName = patientName;
        this.doctorName = doctorName;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.durationMinutes = durationMinutes;
        this.consultationFee = consultationFee;
    }
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData() {
        return {
            appointmentId: this.appointmentId,
            patientId: this.patientId,
            patientName: this.patientName,
            doctorId: this.doctorId,
            doctorName: this.doctorName,
            departmentId: this.departmentId,
            departmentName: this.departmentName,
            appointmentDate: this.appointmentDate,
            appointmentTime: this.appointmentTime,
            durationMinutes: this.durationMinutes,
            consultationFee: this.consultationFee,
            confirmedAt: this.occurredAt,
            confirmedBy: this.confirmedBy,
            confirmationMethod: this.confirmationMethod
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
exports.AppointmentConfirmedEvent = AppointmentConfirmedEvent;
//# sourceMappingURL=AppointmentConfirmedEvent.js.map