"use strict";
/**
 * AppointmentWaitlist Entity - Domain Layer
 * Represents a patient waiting for an appointment slot
 *
 * CONTEXT:
 * Waitlist is different from Queue:
 * - Queue: Same-day waiting (patients checked in, waiting to see doctor)
 * - Waitlist: Future appointment waiting (patients waiting for available slots)
 *
 * USE CASES:
 * - No available slots for preferred date/time
 * - Patient flexible with date/time/doctor
 * - Automatic matching when slots become available
 * - Priority-based slot allocation
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentWaitlist = exports.PreferredContactMethod = exports.WaitlistStatus = exports.WaitlistPriority = void 0;
const entity_1 = require("../../../../shared/domain/base/entity");
const crypto_1 = __importDefault(require("crypto"));
// Enums
var WaitlistPriority;
(function (WaitlistPriority) {
    WaitlistPriority["EMERGENCY"] = "EMERGENCY";
    WaitlistPriority["URGENT"] = "URGENT";
    WaitlistPriority["NORMAL"] = "NORMAL";
    WaitlistPriority["LOW"] = "LOW";
})(WaitlistPriority || (exports.WaitlistPriority = WaitlistPriority = {}));
var WaitlistStatus;
(function (WaitlistStatus) {
    WaitlistStatus["WAITING"] = "WAITING";
    WaitlistStatus["MATCHED"] = "MATCHED";
    WaitlistStatus["CONVERTED"] = "CONVERTED";
    WaitlistStatus["CANCELLED"] = "CANCELLED";
    WaitlistStatus["EXPIRED"] = "EXPIRED";
})(WaitlistStatus || (exports.WaitlistStatus = WaitlistStatus = {}));
var PreferredContactMethod;
(function (PreferredContactMethod) {
    PreferredContactMethod["SMS"] = "SMS";
    PreferredContactMethod["EMAIL"] = "EMAIL";
    PreferredContactMethod["PUSH"] = "PUSH";
    PreferredContactMethod["CALL"] = "CALL";
})(PreferredContactMethod || (exports.PreferredContactMethod = PreferredContactMethod = {}));
/**
 * AppointmentWaitlist Entity
 */
class AppointmentWaitlist extends entity_1.Entity {
    constructor(props) {
        super(props);
    }
    /**
     * Create new waitlist entry
     */
    static create(props) {
        const now = new Date();
        return new AppointmentWaitlist({
            ...props,
            waitlistId: crypto_1.default.randomUUID(),
            status: WaitlistStatus.WAITING,
            createdAt: now,
            updatedAt: now,
        });
    }
    /**
     * Reconstitute from database
     */
    static reconstitute(props) {
        return new AppointmentWaitlist(props);
    }
    // Getters
    get waitlistId() {
        return this.props.waitlistId;
    }
    get patientId() {
        return this.props.patientId;
    }
    get preferredDoctorId() {
        return this.props.preferredDoctorId;
    }
    get preferredDepartmentId() {
        return this.props.preferredDepartmentId;
    }
    get preferredDate() {
        return this.props.preferredDate;
    }
    get preferredTimeSlot() {
        return this.props.preferredTimeSlot;
    }
    get appointmentType() {
        return this.props.appointmentType;
    }
    get priority() {
        return this.props.priority;
    }
    get status() {
        return this.props.status;
    }
    get notes() {
        return this.props.notes;
    }
    get reason() {
        return this.props.reason;
    }
    get isFlexibleDate() {
        return this.props.isFlexibleDate;
    }
    get isFlexibleTime() {
        return this.props.isFlexibleTime;
    }
    get isFlexibleDoctor() {
        return this.props.isFlexibleDoctor;
    }
    get matchedAppointmentId() {
        return this.props.matchedAppointmentId;
    }
    get matchedAt() {
        return this.props.matchedAt;
    }
    get matchedBy() {
        return this.props.matchedBy;
    }
    get expiresAt() {
        return this.props.expiresAt;
    }
    get contactPhone() {
        return this.props.contactPhone;
    }
    get contactEmail() {
        return this.props.contactEmail;
    }
    get preferredContactMethod() {
        return this.props.preferredContactMethod;
    }
    /**
     * Mark as matched with appointment slot
     */
    markAsMatched(appointmentId, matchedBy) {
        if (this.props.status !== WaitlistStatus.WAITING) {
            throw new Error("Can only match waitlist entries with WAITING status");
        }
        this.props.status = WaitlistStatus.MATCHED;
        this.props.matchedAppointmentId = appointmentId;
        this.props.matchedAt = new Date();
        this.props.matchedBy = matchedBy;
        this.props.updatedAt = new Date();
    }
    /**
     * Convert to appointment (final step)
     */
    convertToAppointment() {
        if (this.props.status !== WaitlistStatus.MATCHED) {
            throw new Error("Can only convert MATCHED waitlist entries");
        }
        this.props.status = WaitlistStatus.CONVERTED;
        this.props.updatedAt = new Date();
    }
    /**
     * Cancel waitlist entry
     */
    cancel(cancelledBy, reason) {
        if (this.props.status === WaitlistStatus.CONVERTED) {
            throw new Error("Cannot cancel already converted waitlist entry");
        }
        if (this.props.status === WaitlistStatus.CANCELLED) {
            throw new Error("Waitlist entry already cancelled");
        }
        this.props.status = WaitlistStatus.CANCELLED;
        this.props.cancelledAt = new Date();
        this.props.cancelledBy = cancelledBy;
        this.props.cancellationReason = reason;
        this.props.updatedAt = new Date();
    }
    /**
     * Mark as expired
     */
    markAsExpired() {
        if (this.props.status !== WaitlistStatus.WAITING) {
            throw new Error("Can only expire WAITING entries");
        }
        this.props.status = WaitlistStatus.EXPIRED;
        this.props.updatedAt = new Date();
    }
    /**
     * Update preferences
     */
    updatePreferences(updates) {
        if (this.props.status !== WaitlistStatus.WAITING) {
            throw new Error("Can only update WAITING entries");
        }
        if (updates.preferredDate !== undefined) {
            this.props.preferredDate = updates.preferredDate;
        }
        if (updates.preferredTimeSlot !== undefined) {
            this.props.preferredTimeSlot = updates.preferredTimeSlot;
        }
        if (updates.preferredDoctorId !== undefined) {
            this.props.preferredDoctorId = updates.preferredDoctorId;
        }
        if (updates.priority !== undefined) {
            this.props.priority = updates.priority;
        }
        if (updates.notes !== undefined) {
            this.props.notes = updates.notes;
        }
        if (updates.isFlexibleDate !== undefined) {
            this.props.isFlexibleDate = updates.isFlexibleDate;
        }
        if (updates.isFlexibleTime !== undefined) {
            this.props.isFlexibleTime = updates.isFlexibleTime;
        }
        if (updates.isFlexibleDoctor !== undefined) {
            this.props.isFlexibleDoctor = updates.isFlexibleDoctor;
        }
        this.props.updatedAt = new Date();
    }
    /**
     * Check if expired
     */
    isExpired() {
        if (!this.props.expiresAt) {
            return false;
        }
        return new Date() > this.props.expiresAt;
    }
    /**
     * Check if can be matched
     */
    canBeMatched() {
        return this.props.status === WaitlistStatus.WAITING && !this.isExpired();
    }
    validate() {
        if (!this.props.patientId) {
            throw new Error("Patient ID is required for waitlist entry");
        }
        if (!this.props.appointmentType) {
            throw new Error("Appointment type is required");
        }
    }
    toPersistence() {
        return { ...this.props };
    }
}
exports.AppointmentWaitlist = AppointmentWaitlist;
//# sourceMappingURL=AppointmentWaitlist.entity.js.map