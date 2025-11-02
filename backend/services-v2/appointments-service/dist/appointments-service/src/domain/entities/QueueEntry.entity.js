"use strict";
/**
 * Queue Entry Entity - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueEntry = exports.QueuePriority = exports.QueueStatus = void 0;
const entity_1 = require("../../../../shared/domain/base/entity");
var QueueStatus;
(function (QueueStatus) {
    QueueStatus["WAITING"] = "WAITING";
    QueueStatus["CALLED"] = "CALLED";
    QueueStatus["IN_PROGRESS"] = "IN_PROGRESS";
    QueueStatus["COMPLETED"] = "COMPLETED";
    QueueStatus["CANCELLED"] = "CANCELLED";
})(QueueStatus || (exports.QueueStatus = QueueStatus = {}));
var QueuePriority;
(function (QueuePriority) {
    QueuePriority["EMERGENCY"] = "EMERGENCY";
    QueuePriority["URGENT"] = "URGENT";
    QueuePriority["NORMAL"] = "NORMAL";
    QueuePriority["LOW"] = "LOW";
})(QueuePriority || (exports.QueuePriority = QueuePriority = {}));
/**
 * Queue Entry Entity
 * Represents a patient in the waiting queue
 */
class QueueEntry extends entity_1.HealthcareEntity {
    constructor(props) {
        super(props);
    }
    /**
     * Create new queue entry
     */
    static create(patientId, doctorId, queueNumber, priority, appointmentId) {
        const props = {
            id: crypto.randomUUID(),
            patientId,
            doctorId,
            appointmentId,
            queueNumber,
            priority,
            status: QueueStatus.WAITING,
            checkInTime: new Date(),
            estimatedWaitMinutes: undefined,
            createdAt: new Date()
        };
        return new QueueEntry(props);
    }
    /**
     * Reconstitute from database
     */
    static reconstitute(props) {
        return new QueueEntry(props);
    }
    // Getters
    get id() {
        return this.props.id;
    }
    get patientId() {
        return this.props.patientId;
    }
    get doctorId() {
        return this.props.doctorId;
    }
    get appointmentId() {
        return this.props.appointmentId;
    }
    get queueNumber() {
        return this.props.queueNumber;
    }
    get priority() {
        return this.props.priority;
    }
    get status() {
        return this.props.status;
    }
    get checkInTime() {
        return this.props.checkInTime;
    }
    get calledTime() {
        return this.props.calledTime;
    }
    get completedTime() {
        return this.props.completedTime;
    }
    get serviceStartedAt() {
        return this.props.serviceStartedAt;
    }
    get serviceCompletedAt() {
        return this.props.serviceCompletedAt;
    }
    get estimatedWaitMinutes() {
        return this.props.estimatedWaitMinutes;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    /**
     * Call patient
     */
    call() {
        if (this.props.status !== QueueStatus.WAITING) {
            throw new Error('Only waiting patients can be called');
        }
        this.props.status = QueueStatus.CALLED;
        this.props.calledTime = new Date();
    }
    /**
     * Start service (patient enters consultation)
     */
    startService() {
        if (this.props.status !== QueueStatus.CALLED) {
            throw new Error('Patient must be called before starting service');
        }
        this.props.status = QueueStatus.IN_PROGRESS;
        this.props.serviceStartedAt = new Date();
    }
    /**
     * Complete service
     */
    complete() {
        if (this.props.status !== QueueStatus.IN_PROGRESS) {
            throw new Error('Service must be in progress to complete');
        }
        this.props.status = QueueStatus.COMPLETED;
        this.props.completedTime = new Date();
        this.props.serviceCompletedAt = new Date();
    }
    /**
     * Cancel queue entry
     */
    cancel() {
        if (this.props.status === QueueStatus.COMPLETED) {
            throw new Error('Cannot cancel completed queue entry');
        }
        this.props.status = QueueStatus.CANCELLED;
    }
    /**
     * Update estimated wait time
     */
    updateEstimatedWait(minutes) {
        this.props.estimatedWaitMinutes = minutes;
    }
    /**
     * Update queue number (when reordering)
     */
    updateQueueNumber(newNumber) {
        this.props.queueNumber = newNumber;
    }
    /**
     * Check if patient is waiting
     */
    isWaiting() {
        return this.props.status === QueueStatus.WAITING;
    }
    /**
     * Check if patient has been called
     */
    isCalled() {
        return this.props.status === QueueStatus.CALLED;
    }
    /**
     * Check if service is in progress
     */
    isInProgress() {
        return this.props.status === QueueStatus.IN_PROGRESS;
    }
    /**
     * Get wait time in minutes
     */
    getWaitTimeMinutes() {
        const endTime = this.props.calledTime || new Date();
        return Math.floor((endTime.getTime() - this.props.checkInTime.getTime()) / 60000);
    }
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
     * Validate business rules (required by base class)
     */
    validateBusinessRules() {
        if (!this.props.patientId || !this.props.doctorId) {
            throw new Error('Patient ID and Doctor ID are required');
        }
        if (this.props.queueNumber < 1) {
            throw new Error('Queue number must be positive');
        }
    }
    /**
     * Anonymize PHI data (required by base class)
     */
    anonymize() {
        const anonymizedProps = {
            ...this.props,
            patientId: '***REDACTED***',
            doctorId: '***REDACTED***',
            appointmentId: this.props.appointmentId ? '***REDACTED***' : undefined
        };
        return QueueEntry.reconstitute(anonymizedProps);
    }
    /**
     * Convert to persistence format (required by base class)
     */
    toPersistence() {
        return {
            id: this.props.id,
            patient_id: this.props.patientId,
            doctor_id: this.props.doctorId,
            appointment_id: this.props.appointmentId,
            queue_number: this.props.queueNumber,
            priority: this.props.priority,
            status: this.props.status,
            check_in_time: this.props.checkInTime.toISOString(),
            called_time: this.props.calledTime?.toISOString(),
            completed_time: this.props.completedTime?.toISOString(),
            estimated_wait_minutes: this.props.estimatedWaitMinutes,
            created_at: this.props.createdAt.toISOString()
        };
    }
    /**
     * Validate entity (legacy method - kept for compatibility)
     */
    validate() {
        if (!this.props.patientId || !this.props.doctorId) {
            throw new Error('Patient ID and Doctor ID are required');
        }
        if (this.props.queueNumber < 1) {
            throw new Error('Queue number must be positive');
        }
    }
}
exports.QueueEntry = QueueEntry;
//# sourceMappingURL=QueueEntry.entity.js.map