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
exports.Appointment = exports.AppointmentStatus = exports.AppointmentPriority = exports.AppointmentType = void 0;
const aggregate_root_1 = require("../../../../shared/domain/base/aggregate-root");
const AppointmentScheduledEvent_1 = require("../events/AppointmentScheduledEvent");
const AppointmentCancelledEvent_1 = require("../events/AppointmentCancelledEvent");
const AppointmentRescheduledEvent_1 = require("../events/AppointmentRescheduledEvent");
const AppointmentNoShowEvent_1 = require("../events/AppointmentNoShowEvent");
const AppointmentCheckedInEvent_1 = require("../events/AppointmentCheckedInEvent");
const AppointmentStartedEvent_1 = require("../events/AppointmentStartedEvent");
const AppointmentConfirmedEvent_1 = require("../events/AppointmentConfirmedEvent");
const AppointmentCompletedEvent_1 = require("../events/AppointmentCompletedEvent");
const AppointmentDetails_vo_1 = require("../value-objects/AppointmentDetails.vo");
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
    AppointmentPriority["LOW"] = "low";
    AppointmentPriority["NORMAL"] = "normal";
    AppointmentPriority["URGENT"] = "urgent";
    AppointmentPriority["EMERGENCY"] = "emergency";
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
    getTenantId() {
        return this.props.tenantId;
    }
    getDoctorId() {
        return this.props.doctorId;
    }
    getVersion() {
        return this.props.version;
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
    /**
     * Get consultation fee (immutable reference for billing-service)
     * NOTE: Appointments service does NOT manage payment state
     */
    getConsultationFee() {
        return this.props.consultationFee;
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
     * Reconstitute appointment from database (with UUID)
     * Used by repository when loading from persistence
     */
    static reconstitute(props, id) {
        return new Appointment(props, id);
    }
    /**
     * Create new appointment
     */
    static create(appointmentId, tenantId, patientId, doctorId, timeSlot, durationMinutes, type, priority, details, consultationFee, createdBy, roomId, departmentId, requiredEquipment) {
        // Business rule validations
        Appointment.validateAppointmentCreation(patientId, doctorId, timeSlot, durationMinutes, consultationFee);
        const props = {
            appointmentId,
            tenantId,
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
            consultationFee, // Immutable reference for billing-service
            reminderSent: false,
            confirmationRequired: true,
            version: 1,
            createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const appointment = new Appointment(props);
        // Domain event
        appointment.addDomainEvent(new AppointmentScheduledEvent_1.AppointmentScheduledEvent(appointmentId.value, patientId, doctorId, timeSlot.appointmentDate, timeSlot.appointmentTime, durationMinutes, type, priority, 'scheduled', consultationFee, createdBy));
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
        // Domain event
        this.addDomainEvent(new AppointmentConfirmedEvent_1.AppointmentConfirmedEvent(this.props.appointmentId.value, this.props.patientId, this.props.doctorId, this.props.confirmedAt, 'manual' // confirmation method
        ));
        this.incrementVersion();
    }
    /**
     * Check in patient
     */
    checkIn(checkInTime) {
        if (this.props.status !== AppointmentStatus.CONFIRMED &&
            this.props.status !== AppointmentStatus.SCHEDULED) {
            throw new Error('Only confirmed or scheduled appointments can be checked in');
        }
        const actualCheckInTime = checkInTime || new Date();
        this.props.status = AppointmentStatus.ARRIVED;
        this.props.checkedInAt = actualCheckInTime;
        this.props.updatedAt = new Date();
        // Domain event
        this.addDomainEvent(new AppointmentCheckedInEvent_1.AppointmentCheckedInEvent(this.props.appointmentId.value, this.props.patientId, this.props.doctorId, actualCheckInTime, this.props.priority));
        this.incrementVersion();
    }
    /**
     * Start appointment
     */
    start(startTime) {
        if (this.props.status !== AppointmentStatus.ARRIVED) {
            throw new Error('Patient must be checked in before starting appointment');
        }
        const actualStartTime = startTime || new Date();
        this.props.status = AppointmentStatus.IN_PROGRESS;
        this.props.startedAt = actualStartTime;
        this.props.updatedAt = new Date();
        // Domain event
        this.addDomainEvent(new AppointmentStartedEvent_1.AppointmentStartedEvent(this.props.appointmentId.value, this.props.patientId, this.props.doctorId, actualStartTime, this.props.roomId));
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
        // Calculate duration
        const duration = this.props.startedAt && this.props.completedAt
            ? Math.round((this.props.completedAt.getTime() - this.props.startedAt.getTime()) / 60000)
            : this.props.durationMinutes;
        // Domain event (includes consultationFee for billing-service to consume)
        // billing-service will create invoice and handle payment lifecycle
        this.addDomainEvent(new AppointmentCompletedEvent_1.AppointmentCompletedEvent(this.props.appointmentId.value, this.props.patientId, this.props.doctorId, this.props.completedAt, duration, this.props.details?.notes, this.props.consultationFee // Billing reference
        ));
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
        // Create originalStartTime from timeSlot
        const originalStartTime = new Date(`${this.props.timeSlot.appointmentDate}T${this.props.timeSlot.appointmentTime}`);
        const originalEndTime = new Date(originalStartTime.getTime() + this.props.durationMinutes * 60 * 1000);
        // Domain event
        this.addDomainEvent(new AppointmentCancelledEvent_1.AppointmentCancelledEvent(this.props.appointmentId.value, this.props.patientId, this.props.doctorId, originalStartTime, reason, cancelledBy, originalEndTime));
        this.incrementVersion();
    }
    /**
     * Mark as no-show
     */
    markAsNoShow(markedBy) {
        if (this.props.status !== AppointmentStatus.CONFIRMED &&
            this.props.status !== AppointmentStatus.SCHEDULED) {
            throw new Error('Only scheduled/confirmed appointments can be marked as no-show');
        }
        this.props.status = AppointmentStatus.NO_SHOW;
        this.props.updatedAt = new Date();
        this.props.lastModifiedBy = markedBy;
        // Domain event
        this.addDomainEvent(new AppointmentNoShowEvent_1.AppointmentNoShowEvent(this.props.appointmentId.value, this.props.patientId, this.props.doctorId, new Date(this.props.timeSlot.appointmentDate), this.props.timeSlot.appointmentTime, new Date()));
        this.incrementVersion();
    }
    /**
     * Transfer appointment to another doctor
     * Business method for changing doctor assignment
     */
    transfer(newDoctorId, reason, transferredBy) {
        // Validate state - cannot transfer completed/cancelled appointments
        if (this.props.status === AppointmentStatus.COMPLETED) {
            throw new Error('Cannot transfer completed appointment');
        }
        if (this.props.status === AppointmentStatus.CANCELLED) {
            throw new Error('Cannot transfer cancelled appointment');
        }
        if (this.props.status === AppointmentStatus.NO_SHOW) {
            throw new Error('Cannot transfer no-show appointment');
        }
        // Store old doctor for event
        const oldDoctorId = this.props.doctorId;
        // Update doctor assignment
        this.props.doctorId = newDoctorId;
        this.props.lastModifiedBy = transferredBy;
        this.props.updatedAt = new Date();
        // Add transfer note to details
        const transferNote = `[${new Date().toISOString()}] Transferred from doctor ${oldDoctorId} to ${newDoctorId}. Reason: ${reason}`;
        const currentNotes = this.props.details.notes || '';
        const updatedNotes = currentNotes ? `${currentNotes}\n${transferNote}` : transferNote;
        this.props.details = AppointmentDetails_vo_1.AppointmentDetails.create(this.props.details.reason, this.props.details.chiefComplaint, this.props.details.symptoms, updatedNotes, this.props.details.specialInstructions);
        this.props.version++;
    }
    /**
     * Reschedule appointment
     */
    reschedule(newTimeSlot, reason, rescheduledBy) {
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
        // Create Date objects from time slot strings
        const originalStartTime = new Date(`${oldTimeSlot.appointmentDate}T${oldTimeSlot.appointmentTime}`);
        const originalEndTime = new Date(originalStartTime.getTime() + this.props.durationMinutes * 60 * 1000);
        const newStartTime = new Date(`${newTimeSlot.appointmentDate}T${newTimeSlot.appointmentTime}`);
        const newEndTime = new Date(newStartTime.getTime() + this.props.durationMinutes * 60 * 1000);
        // Domain event
        this.addDomainEvent(new AppointmentRescheduledEvent_1.AppointmentRescheduledEvent(this.props.appointmentId.value, this.props.patientId, this.props.doctorId, originalStartTime, originalEndTime, newStartTime, newEndTime, reason, rescheduledBy));
        this.incrementVersion();
    }
    // Getters (shorthand accessors)
    get appointmentId() { return this.props.appointmentId; }
    get patientId() { return this.props.patientId; }
    get doctorId() { return this.props.doctorId; }
    get timeSlot() { return this.props.timeSlot; }
    get durationMinutes() { return this.props.durationMinutes; }
    get type() { return this.props.type; }
    get priority() { return this.props.priority; }
    get status() { return this.props.status; }
    get details() { return this.props.details; }
    get consultationFee() { return this.props.consultationFee; } // Billing reference only
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
        // For now, we use state-based persistence, so this is a no-op
        // In future, implement event sourcing logic here
    }
    // ==================== Required Abstract Methods ====================
    /**
     * Validate entity state (required by HealthcareAggregateRoot base class)
     */
    validate() {
        this.validateBusinessInvariants();
    }
    /**
     * Convert to persistence format (required by HealthcareAggregateRoot base class)
     * Note: This is a minimal stub. Use AppointmentMapper.toPersistence() for actual persistence.
     */
    toPersistence() {
        return {
            id: this.id,
            appointment_id: this.props.appointmentId.value
        };
    }
}
exports.Appointment = Appointment;
//# sourceMappingURL=Appointment.aggregate.js.map