"use strict";
/**
 * AppointmentReminder Entity - Domain Layer
 * Represents a MANUALLY CREATED reminder for an appointment
 *
 * ⚠️ ARCHITECTURE NOTE: ALTERNATIVE APPROACH ⚠️
 *
 * This entity provides manual reminder management as an ALTERNATIVE to the existing
 * auto-scheduling system. Most reminders should use the Scheduler Service integration.
 *
 * EXISTING INTEGRATION (Preferred):
 * - Appointments Service → Scheduler Service (via event-driven architecture)
 * - Auto-generated reminders when appointment is created
 * - Managed by: AppointmentScheduledSchedulerHandler
 * - Storage: scheduler.schedules table in Supabase
 * - Policy-based: src/config/reminder-policy.json
 *
 * THIS ENTITY (Alternative):
 * - Manual reminder creation via CRUD API
 * - Local storage in appointments_schema.appointment_reminders
 * - Use cases:
 *   1. Custom reminders outside policy (e.g., special patient requests)
 *   2. One-off reminders not tied to appointment lifecycle
 *   3. Override auto-generated reminders for specific cases
 *   4. Testing/debugging reminder functionality
 *
 * WHEN TO USE:
 * - Manual control needed for specific reminders
 * - Custom reminder logic beyond policy
 * - Local storage/querying required
 *
 * WHEN NOT TO USE:
 * - Standard appointment reminders → Use Scheduler Service integration
 * - Policy-based reminders → Already auto-generated
 * - Bulk reminder operations → Use Scheduler Service API
 *
 * COEXISTENCE:
 * Both systems can coexist:
 * - Auto-generated reminders: scheduler.schedules (via Scheduler Service)
 * - Manual reminders: appointment_reminders (via this entity)
 * - No conflicts as they use different storage and workflows
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 * @see AppointmentScheduledSchedulerHandler for auto-scheduling implementation
 * @see RemoteSchedulerAdapter for Scheduler Service integration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentReminder = exports.ReminderPriority = exports.RecipientType = exports.ReminderStatus = exports.ReminderChannel = exports.ReminderType = void 0;
const entity_1 = require("../../../../shared/domain/base/entity");
const crypto_1 = __importDefault(require("crypto"));
var ReminderType;
(function (ReminderType) {
    ReminderType["EMAIL"] = "email";
    ReminderType["SMS"] = "sms";
    ReminderType["PUSH"] = "push";
    ReminderType["IN_APP"] = "in_app";
})(ReminderType || (exports.ReminderType = ReminderType = {}));
var ReminderChannel;
(function (ReminderChannel) {
    ReminderChannel["EMAIL"] = "email";
    ReminderChannel["SMS"] = "sms";
    ReminderChannel["PUSH_NOTIFICATION"] = "push_notification";
    ReminderChannel["IN_APP_NOTIFICATION"] = "in_app_notification";
})(ReminderChannel || (exports.ReminderChannel = ReminderChannel = {}));
var ReminderStatus;
(function (ReminderStatus) {
    ReminderStatus["PENDING"] = "pending";
    ReminderStatus["SENT"] = "sent";
    ReminderStatus["FAILED"] = "failed";
    ReminderStatus["CANCELLED"] = "cancelled";
})(ReminderStatus || (exports.ReminderStatus = ReminderStatus = {}));
var RecipientType;
(function (RecipientType) {
    RecipientType["PATIENT"] = "patient";
    RecipientType["DOCTOR"] = "doctor";
    RecipientType["BOTH"] = "both";
})(RecipientType || (exports.RecipientType = RecipientType = {}));
var ReminderPriority;
(function (ReminderPriority) {
    ReminderPriority["LOW"] = "low";
    ReminderPriority["NORMAL"] = "normal";
    ReminderPriority["HIGH"] = "high";
    ReminderPriority["URGENT"] = "urgent";
})(ReminderPriority || (exports.ReminderPriority = ReminderPriority = {}));
/**
 * AppointmentReminder Entity
 * Manages reminder lifecycle and validation
 */
class AppointmentReminder extends entity_1.Entity {
    constructor(props) {
        super(props, props.reminderId);
    }
    /**
     * Factory method to create a new reminder
     */
    static create(props) {
        const now = new Date();
        // Validation
        if (props.sendBeforeMinutes <= 0) {
            throw new Error("Send before minutes must be positive");
        }
        if (props.scheduledAt <= now) {
            throw new Error("Scheduled time must be in the future");
        }
        if (props.reminderChannel === ReminderChannel.EMAIL &&
            !props.recipientEmail) {
            throw new Error("Email address required for email reminders");
        }
        if (props.reminderChannel === ReminderChannel.SMS &&
            !props.recipientPhone) {
            throw new Error("Phone number required for SMS reminders");
        }
        const reminderProps = {
            ...props,
            reminderId: crypto_1.default.randomUUID(),
            status: ReminderStatus.PENDING,
            retryCount: 0,
            createdAt: now,
            updatedAt: now,
        };
        return new AppointmentReminder(reminderProps);
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props) {
        return new AppointmentReminder(props);
    }
    // Getters
    get reminderId() {
        return this.props.reminderId;
    }
    get appointmentId() {
        return this.props.appointmentId;
    }
    get tenantId() {
        return this.props.tenantId;
    }
    get reminderType() {
        return this.props.reminderType;
    }
    get reminderChannel() {
        return this.props.reminderChannel;
    }
    get scheduledAt() {
        return this.props.scheduledAt;
    }
    get sendBeforeMinutes() {
        return this.props.sendBeforeMinutes;
    }
    get status() {
        return this.props.status;
    }
    get message() {
        return this.props.message;
    }
    get recipientType() {
        return this.props.recipientType;
    }
    get priority() {
        return this.props.priority;
    }
    /**
     * Mark reminder as sent
     */
    markAsSent() {
        if (this.props.status !== ReminderStatus.PENDING) {
            throw new Error("Only pending reminders can be marked as sent");
        }
        this.props.status = ReminderStatus.SENT;
        this.props.sentAt = new Date();
        this.props.updatedAt = new Date();
    }
    /**
     * Mark reminder as failed
     */
    markAsFailed(reason) {
        this.props.status = ReminderStatus.FAILED;
        this.props.failedAt = new Date();
        this.props.failureReason = reason;
        this.props.retryCount += 1;
        this.props.updatedAt = new Date();
    }
    /**
     * Cancel reminder
     */
    cancel() {
        if (this.props.status === ReminderStatus.SENT) {
            throw new Error("Cannot cancel already sent reminder");
        }
        this.props.status = ReminderStatus.CANCELLED;
        this.props.updatedAt = new Date();
    }
    /**
     * Check if reminder can be retried
     */
    canRetry() {
        return (this.props.status === ReminderStatus.FAILED &&
            this.props.retryCount < this.props.maxRetries);
    }
    validate() {
        if (!this.props.appointmentId) {
            throw new Error("Appointment ID is required for reminder");
        }
        if (!this.props.message || this.props.message.trim().length === 0) {
            throw new Error("Reminder message is required");
        }
        if (!this.props.recipientId) {
            throw new Error("Recipient ID is required");
        }
    }
    toPersistence() {
        return { ...this.props };
    }
}
exports.AppointmentReminder = AppointmentReminder;
//# sourceMappingURL=AppointmentReminder.entity.js.map