"use strict";
/**
 * Appointment Scheduled Event - Domain Layer
 * V3 Clean Architecture + DDD + Event-Driven Implementation
 * Follows Identity and Provider service pattern - accepts primitive values
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentScheduledEvent = void 0;
const domain_event_1 = require("../../../../shared/domain/base/domain-event");
/**
 * Appointment Scheduled Domain Event
 * Triggered when a new appointment is successfully scheduled
 *
 * Pattern: Accepts primitive values/value objects (following Identity & Provider service pattern)
 * This allows better serialization and decoupling from aggregate structure
 */
class AppointmentScheduledEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, appointmentDate, appointmentTime, durationMinutes, type, priority, status, consultationFee, createdBy, reason, notes, correlationId, causationId, userId) {
        const eventData = {
            appointmentId,
            patientId,
            doctorId,
            appointmentDate,
            appointmentTime,
            durationMinutes,
            type,
            priority,
            status,
            consultationFee,
            createdBy,
            scheduledAt: new Date(),
            reason,
            notes
        };
        super('AppointmentScheduled', appointmentId, 'Appointment', eventData, 1, correlationId, causationId, userId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.durationMinutes = durationMinutes;
        this.type = type;
        this.priority = priority;
        this.status = status;
        this.consultationFee = consultationFee;
        this.createdBy = createdBy;
        this.reason = reason;
        this.notes = notes;
    }
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData() {
        return {
            appointmentId: this.appointmentId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            appointmentDate: this.appointmentDate,
            appointmentTime: this.appointmentTime,
            durationMinutes: this.durationMinutes,
            type: this.type,
            priority: this.priority,
            status: this.status,
            consultationFee: this.consultationFee,
            createdBy: this.createdBy,
            scheduledAt: this.occurredAt,
            reason: this.reason,
            notes: this.notes
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
exports.AppointmentScheduledEvent = AppointmentScheduledEvent;
//# sourceMappingURL=AppointmentScheduledEvent.js.map