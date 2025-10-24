"use strict";
/**
 * Appointment Aggregate Root - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Rebuilt to align 100% with scheduling_schema database
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Appointment = exports.PaymentStatus = exports.AppointmentStatus = exports.AppointmentPriority = exports.AppointmentType = void 0;
const aggregate_root_1 = require("../../shared/domain/base/aggregate-root");
const AppointmentScheduledEvent_1 = require("../events/AppointmentScheduledEvent");
const AppointmentCancelledEvent_1 = require("../events/AppointmentCancelledEvent");
const AppointmentRescheduledEvent_1 = require("../events/AppointmentRescheduledEvent");
var AppointmentType;
(function (AppointmentType) {
    AppointmentType["CONSULTATION"] = "consultation";
    AppointmentType["FOLLOW_UP"] = "follow_up";
    AppointmentType["EMERGENCY"] = "emergency";
    AppointmentType["TELEMEDICINE"] = "telemedicine";
    AppointmentType["SURGERY"] = "surgery";
    AppointmentType["PROCEDURE"] = "procedure";
})(AppointmentType || (exports.AppointmentType = AppointmentType = {}));
var AppointmentPriority;
(function (AppointmentPriority) {
    AppointmentPriority["ROUTINE"] = "routine";
    AppointmentPriority["URGENT"] = "urgent";
    AppointmentPriority["EMERGENCY"] = "emergency";
    AppointmentPriority["STAT"] = "stat";
})(AppointmentPriority || (exports.AppointmentPriority = AppointmentPriority = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["SCHEDULED"] = "scheduled";
    AppointmentStatus["CONFIRMED"] = "confirmed";
    AppointmentStatus["ARRIVED"] = "arrived";
    AppointmentStatus["IN_PROGRESS"] = "in_progress";
    AppointmentStatus["COMPLETED"] = "completed";
    AppointmentStatus["CANCELLED"] = "cancelled";
    AppointmentStatus["NO_SHOW"] = "no_show";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["PARTIALLY_PAID"] = "partially_paid";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["CANCELLED"] = "cancelled";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
/**
 * Appointment Aggregate Root
 * Manages appointment lifecycle with Vietnamese healthcare business rules
 * Follows DDD aggregate pattern: only stores IDs, not denormalized data
 */
class Appointment extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    // Getters - Expose properties following DDD best practices
    get id() {
        return this._id;
    }
    getAppointmentId() {
        return this.props.appointmentId;
    }
    getPatientId() {
        return this.props.patientId;
    }
    getDoctorId() {
        return this.props.doctorId;
    }
    getTimeSlot() {
        return this.props.timeSlot;
    }
    getDurationMinutes() {
        return this.props.durationMinutes;
    }
    getType() {
        return this.props.type;
    }
    getPriority() {
        return this.props.priority;
    }
    getStatus() {
        return this.props.status;
    }
    getDetails() {
        return this.props.details;
    }
    getRoomId() {
        return this.props.roomId;
    }
    getDepartmentId() {
        return this.props.departmentId;
    }
    getRequiredEquipment() {
        return this.props.requiredEquipment ? [...this.props.requiredEquipment] : undefined;
    }
    getConsultationFee() {
        return this.props.consultationFee;
    }
    getAdditionalFees() {
        return this.props.additionalFees;
    }
    getPaymentStatus() {
        return this.props.paymentStatus;
    }
    getPaymentMethod() {
        return this.props.paymentMethod;
    }
    getCheckedInAt() {
        return this.props.checkedInAt;
    }
    getStartedAt() {
        return this.props.startedAt;
    }
    getCompletedAt() {
        return this.props.completedAt;
    }
    getCancelledAt() {
        return this.props.cancelledAt;
    }
    getCancellationReason() {
        return this.props.cancellationReason;
    }
    getCancelledBy() {
        return this.props.cancelledBy;
    }
    getFollowUpAppointmentId() {
        return this.props.followUpAppointmentId;
    }
    getParentAppointmentId() {
        return this.props.parentAppointmentId;
    }
    getSeriesId() {
        return this.props.seriesId;
    }
    getReminderSent() {
        return this.props.reminderSent;
    }
    getReminderSentAt() {
        return this.props.reminderSentAt;
    }
    getConfirmationRequired() {
        return this.props.confirmationRequired;
    }
    getConfirmedAt() {
        return this.props.confirmedAt;
    }
    getConfirmedBy() {
        return this.props.confirmedBy;
    }
    getCreatedBy() {
        return this.props.createdBy;
    }
    getLastModifiedBy() {
        return this.props.lastModifiedBy;
    }
    getCreatedAt() {
        return this.props.createdAt;
    }
    getUpdatedAt() {
        return this.props.updatedAt;
    }
    /**
     * Create new appointment
     */
    static create(appointmentId, patientId, doctorId, timeSlot, durationMinutes, type, priority, details, consultationFee, createdBy, roomId, departmentId, requiredEquipment) {
        // Business rule validations
        Appointment.validateAppointmentCreation(patientId, doctorId, timeSlot, durationMinutes, consultationFee);
        const props = {
            appointmentId,
            patientId,
            doctorId,
            timeSlot,
            durationMinutes,
            type,
            priority,
            status: AppointmentStatus.SCHEDULED,
            details,
            roomId,
            departmentId,
            requiredEquipment,
            consultationFee,
            additionalFees: 0,
            paymentStatus: PaymentStatus.PENDING,
            reminderSent: false,
            confirmationRequired: true,
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const appointment = new Appointment(props);
        // Domain event
        appointment.addDomainEvent(new AppointmentScheduledEvent_1.AppointmentScheduledEvent(appointmentId.value, patientId, doctorId, timeSlot.appointmentDate, timeSlot.appointmentTime, type, priority));
        return appointment;
    }
    /**
     * Validate appointment creation
     */
    static validateAppointmentCreation(patientId, doctorId, timeSlot, durationMinutes, consultationFee) {
        if (!patientId || !doctorId) {
            throw new Error('Patient ID and Doctor ID are required');
        }
        if (durationMinutes <= 0 || durationMinutes > 480) {
            throw new Error('Duration must be between 1 and 480 minutes');
        }
        if (consultationFee < 0) {
            throw new Error('Consultation fee cannot be negative');
        }
        if (timeSlot.isPast()) {
            throw new Error('Cannot schedule appointment in the past');
        }
    }
    /**
     * Confirm appointment
     */
    confirm(confirmedBy) {
        if (this.props.status !== AppointmentStatus.SCHEDULED) {
            throw new Error('Only scheduled appointments can be confirmed');
        }
        this.props.status = AppointmentStatus.CONFIRMED;
        this.props.confirmedAt = new Date();
        this.props.confirmedBy = confirmedBy;
        this.props.updatedAt = new Date();
        this.props.lastModifiedBy = confirmedBy;
        this.incrementVersion();
    }
    /**
     * Check in patient
     */
    checkIn() {
        if (this.props.status !== AppointmentStatus.CONFIRMED) {
            throw new Error('Only confirmed appointments can be checked in');
        }
        this.props.status = AppointmentStatus.ARRIVED;
        this.props.checkedInAt = new Date();
        this.props.updatedAt = new Date();
        this.incrementVersion();
    }
    /**
     * Start appointment
     */
    start() {
        if (this.props.status !== AppointmentStatus.ARRIVED) {
            throw new Error('Patient must be checked in before starting appointment');
        }
        this.props.status = AppointmentStatus.IN_PROGRESS;
        this.props.startedAt = new Date();
        this.props.updatedAt = new Date();
        this.incrementVersion();
    }
    /**
     * Complete appointment
     */
    complete() {
        if (this.props.status !== AppointmentStatus.IN_PROGRESS) {
            throw new Error('Only in-progress appointments can be completed');
        }
        this.props.status = AppointmentStatus.COMPLETED;
        this.props.completedAt = new Date();
        this.props.updatedAt = new Date();
        this.incrementVersion();
    }
    /**
     * Cancel appointment
     */
    cancel(reason, cancelledBy) {
        if (this.props.status === AppointmentStatus.COMPLETED) {
            throw new Error('Cannot cancel completed appointment');
        }
        if (this.props.status === AppointmentStatus.CANCELLED) {
            throw new Error('Appointment is already cancelled');
        }
        this.props.status = AppointmentStatus.CANCELLED;
        this.props.cancelledAt = new Date();
        this.props.cancellationReason = reason;
        this.props.cancelledBy = cancelledBy;
        this.props.updatedAt = new Date();
        this.props.lastModifiedBy = cancelledBy;
        // Domain event
        this.addDomainEvent(new AppointmentCancelledEvent_1.AppointmentCancelledEvent(this.props.appointmentId.value, this.props.patientId, this.props.doctorId, reason, cancelledBy));
        this.incrementVersion();
    }
    /**
     * Mark as no-show
     */
    markAsNoShow() {
        if (this.props.status !== AppointmentStatus.CONFIRMED &&
            this.props.status !== AppointmentStatus.SCHEDULED) {
            throw new Error('Only scheduled/confirmed appointments can be marked as no-show');
        }
        this.props.status = AppointmentStatus.NO_SHOW;
        this.props.updatedAt = new Date();
        this.incrementVersion();
    }
    /**
     * Reschedule appointment
     */
    reschedule(newTimeSlot, rescheduledBy) {
        if (this.props.status === AppointmentStatus.COMPLETED) {
            throw new Error('Cannot reschedule completed appointment');
        }
        if (this.props.status === AppointmentStatus.CANCELLED) {
            throw new Error('Cannot reschedule cancelled appointment');
        }
        if (newTimeSlot.isPast()) {
            throw new Error('Cannot reschedule to past time');
        }
        const oldTimeSlot = this.props.timeSlot;
        this.props.timeSlot = newTimeSlot;
        this.props.status = AppointmentStatus.SCHEDULED;
        this.props.confirmedAt = undefined;
        this.props.confirmedBy = undefined;
        this.props.updatedAt = new Date();
        this.props.lastModifiedBy = rescheduledBy;
        // Domain event
        this.addDomainEvent(new AppointmentRescheduledEvent_1.AppointmentRescheduledEvent(this.props.appointmentId.value, this.props.patientId, this.props.doctorId, oldTimeSlot.appointmentDate, oldTimeSlot.appointmentTime, newTimeSlot.appointmentDate, newTimeSlot.appointmentTime, rescheduledBy));
        this.incrementVersion();
    }
    // Getters
    get appointmentId() { return this.props.appointmentId; }
    get patientId() { return this.props.patientId; }
    get doctorId() { return this.props.doctorId; }
    get timeSlot() { return this.props.timeSlot; }
    get durationMinutes() { return this.props.durationMinutes; }
    get type() { return this.props.type; }
    get priority() { return this.props.priority; }
    get status() { return this.props.status; }
    get details() { return this.props.details; }
    get consultationFee() { return this.props.consultationFee; }
    get paymentStatus() { return this.props.paymentStatus; }
    /**
     * Healthcare-specific: Contains PHI
     */
    containsPHI() {
        return true;
    }
    /**
     * Healthcare-specific: Get patient ID
     */
    getPatientId() {
        return this.props.patientId;
    }
    /**
     * Validate business invariants
     */
    validateBusinessInvariants() {
        if (!this.props.patientId || !this.props.doctorId) {
            throw new Error('Patient ID and Doctor ID are required');
        }
        if (this.props.durationMinutes <= 0) {
            throw new Error('Duration must be positive');
        }
        if (this.props.consultationFee < 0) {
            throw new Error('Consultation fee cannot be negative');
        }
    }
    /**
     * Apply domain event (for event sourcing)
     */
    applyEvent(event) {
        // Event sourcing logic can be implemented here
    }
}
exports.Appointment = Appointment;
//# sourceMappingURL=Appointment.aggregate.js.map