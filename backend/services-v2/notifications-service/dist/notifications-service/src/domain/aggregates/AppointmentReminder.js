"use strict";
/**
 * AppointmentReminder Aggregate Root
 * Represents an appointment reminder schedule in the domain
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentReminder = void 0;
const AggregateRoot_1 = require("@shared/domain/base/AggregateRoot");
const Result_1 = require("@shared/core/Result");
const ReminderStatus_1 = require("../value-objects/ReminderStatus");
class AppointmentReminder extends AggregateRoot_1.AggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Factory method to create a new reminder
     */
    static create(props, id) {
        // Validation
        if (!props.appointmentId || props.appointmentId.trim().length === 0) {
            return Result_1.Result.fail('Appointment ID is required');
        }
        if (!props.patientId || props.patientId.trim().length === 0) {
            return Result_1.Result.fail('Patient ID is required');
        }
        if (!props.appointmentDate) {
            return Result_1.Result.fail('Appointment date is required');
        }
        if (!props.appointmentTime) {
            return Result_1.Result.fail('Appointment time is required');
        }
        if (!props.scheduledSendTime) {
            return Result_1.Result.fail('Scheduled send time is required');
        }
        // Ensure at least one contact method
        if (!props.patientPhone && !props.patientEmail) {
            return Result_1.Result.fail('Patient must have at least one contact method (phone or email)');
        }
        // Set defaults
        const defaultProps = {
            ...props,
            tenantId: props.tenantId || 'hospital-1',
            status: props.status || ReminderStatus_1.ReminderStatus.PENDING,
            channels: props.channels || ['SMS', 'EMAIL'],
            preferredChannel: props.preferredChannel || 'SMS',
            patientLanguage: props.patientLanguage || 'vi',
            retryCount: props.retryCount || 0,
            maxRetries: props.maxRetries || 3,
            templateId: props.templateId || 'APPOINTMENT_REMINDER',
            templateData: props.templateData || {},
            metadata: props.metadata || {},
            createdAt: props.createdAt || new Date(),
            updatedAt: props.updatedAt || new Date(),
            createdBy: props.createdBy || 'system',
        };
        const reminder = new AppointmentReminder(defaultProps, id);
        return Result_1.Result.ok(reminder);
    }
    // ==============================================
    // Getters
    // ==============================================
    get reminderId() {
        return this._id;
    }
    get appointmentId() {
        return this.props.appointmentId;
    }
    get tenantId() {
        return this.props.tenantId;
    }
    get patientId() {
        return this.props.patientId;
    }
    get patientName() {
        return this.props.patientName;
    }
    get patientPhone() {
        return this.props.patientPhone;
    }
    get patientEmail() {
        return this.props.patientEmail;
    }
    get doctorName() {
        return this.props.doctorName;
    }
    get appointmentDate() {
        return this.props.appointmentDate;
    }
    get appointmentTime() {
        return this.props.appointmentTime;
    }
    get reminderType() {
        return this.props.reminderType;
    }
    get scheduledSendTime() {
        return this.props.scheduledSendTime;
    }
    get status() {
        return this.props.status;
    }
    get notificationId() {
        return this.props.notificationId;
    }
    get sentAt() {
        return this.props.sentAt;
    }
    get retryCount() {
        return this.props.retryCount || 0;
    }
    get maxRetries() {
        return this.props.maxRetries || 3;
    }
    get templateData() {
        return this.props.templateData || {};
    }
    // ==============================================
    // Business Logic Methods
    // ==============================================
    /**
     * Check if reminder is due to be sent
     */
    isDue(currentTime = new Date()) {
        return (this.props.status.isPending() &&
            this.props.scheduledSendTime <= currentTime);
    }
    /**
     * Check if reminder can be retried
     */
    canRetry() {
        return (this.props.status.isFailed() &&
            this.props.retryCount < this.props.maxRetries);
    }
    /**
     * Mark as processing
     */
    markAsProcessing() {
        if (!this.props.status.isPending()) {
            return Result_1.Result.fail(`Cannot process reminder with status: ${this.props.status.toString()}`);
        }
        this.props.status = ReminderStatus_1.ReminderStatus.PROCESSING;
        this.props.updatedAt = new Date();
        return Result_1.Result.ok();
    }
    /**
     * Mark as sent
     */
    markAsSent(notificationId) {
        if (!this.props.status.isProcessing()) {
            return Result_1.Result.fail(`Cannot mark as sent reminder with status: ${this.props.status.toString()}`);
        }
        this.props.status = ReminderStatus_1.ReminderStatus.SENT;
        this.props.notificationId = notificationId;
        this.props.sentAt = new Date();
        this.props.updatedAt = new Date();
        return Result_1.Result.ok();
    }
    /**
     * Mark as failed
     */
    markAsFailed(reason) {
        this.props.status = ReminderStatus_1.ReminderStatus.FAILED;
        this.props.failedAt = new Date();
        this.props.failureReason = reason;
        this.props.retryCount = (this.props.retryCount || 0) + 1;
        this.props.lastRetryAt = new Date();
        // Calculate next retry time (exponential backoff)
        if (this.canRetry()) {
            const backoffMinutes = Math.pow(2, this.props.retryCount) * 5; // 5, 10, 20 minutes
            const nextRetry = new Date();
            nextRetry.setMinutes(nextRetry.getMinutes() + backoffMinutes);
            this.props.nextRetryAt = nextRetry;
        }
        this.props.updatedAt = new Date();
        return Result_1.Result.ok();
    }
    /**
     * Cancel reminder
     */
    cancel(reason, cancelledBy) {
        if (!this.props.status.canCancel()) {
            return Result_1.Result.fail(`Cannot cancel reminder with status: ${this.props.status.toString()}`);
        }
        this.props.status = ReminderStatus_1.ReminderStatus.CANCELLED;
        this.props.cancelledAt = new Date();
        this.props.cancelledBy = cancelledBy;
        this.props.cancellationReason = reason;
        this.props.updatedAt = new Date();
        return Result_1.Result.ok();
    }
    /**
     * Mark as expired (past appointment date)
     */
    markAsExpired() {
        if (this.props.status.isFinal()) {
            return Result_1.Result.ok(); // Already final, no need to update
        }
        this.props.status = ReminderStatus_1.ReminderStatus.EXPIRED;
        this.props.updatedAt = new Date();
        return Result_1.Result.ok();
    }
    /**
     * Get template variables for reminder message
     */
    getTemplateVariables() {
        return {
            patientName: this.props.patientName,
            doctorName: this.props.doctorName,
            doctorSpecialization: this.props.doctorSpecialization,
            appointmentDate: this.formatDate(this.props.appointmentDate),
            appointmentTime: this.props.appointmentTime,
            appointmentType: this.props.appointmentType,
            reason: this.props.reason,
            reminderType: this.props.reminderType.getDescriptionVi(),
            ...this.props.templateData,
        };
    }
    /**
     * Format date for Vietnamese locale
     */
    formatDate(date) {
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
    /**
     * Get appointment date time
     */
    getAppointmentDateTime() {
        const [hours, minutes] = this.props.appointmentTime.split(':').map(Number);
        const datetime = new Date(this.props.appointmentDate);
        datetime.setHours(hours, minutes, 0, 0);
        return datetime;
    }
    /**
     * Check if appointment is in the past
     */
    isAppointmentPast(currentTime = new Date()) {
        return this.getAppointmentDateTime() < currentTime;
    }
}
exports.AppointmentReminder = AppointmentReminder;
//# sourceMappingURL=AppointmentReminder.js.map