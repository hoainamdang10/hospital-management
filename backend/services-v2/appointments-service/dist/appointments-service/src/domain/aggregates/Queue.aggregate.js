"use strict";
/**
 * Queue Aggregate Root - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * Aggregate Root for managing waiting queue with priority-based ordering
 * Encapsulates all business logic for queue management
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
const aggregate_root_1 = require("../../../../shared/domain/base/aggregate-root");
const QueueEntry_entity_1 = require("../entities/QueueEntry.entity");
const PatientJoinedQueueEvent_1 = require("../events/PatientJoinedQueueEvent");
const PatientCalledEvent_1 = require("../events/PatientCalledEvent");
const PatientLeftQueueEvent_1 = require("../events/PatientLeftQueueEvent");
/**
 * Queue Aggregate Root
 *
 * Responsibilities:
 * - Manage collection of QueueEntry entities
 * - Enforce queue business rules (priority, ordering)
 * - Calculate queue positions and wait times
 * - Emit domain events for queue changes
 * - Ensure consistency of queue state
 *
 * Business Rules:
 * 1. Priority order: EMERGENCY > URGENT > NORMAL > LOW
 * 2. Within same priority: First come, first served (FIFO)
 * 3. Emergency patients can jump the queue
 * 4. Only one patient can be called at a time per doctor
 * 5. Queue numbers are recalculated after each change
 */
class Queue extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props) {
        super(props);
    }
    /**
     * Create new queue for doctor on specific date
     */
    static create(doctorId, date, averageConsultationMinutes = 15) {
        const props = {
            id: `QUEUE-${doctorId}-${date.toISOString().split('T')[0]}`,
            doctorId,
            date,
            entries: [],
            averageConsultationMinutes,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return new Queue(props);
    }
    /**
     * Reconstitute from database
     */
    static reconstitute(props) {
        return new Queue(props);
    }
    // ==================== GETTERS ====================
    get id() {
        return this.props.id;
    }
    get doctorId() {
        return this.props.doctorId;
    }
    get date() {
        return this.props.date;
    }
    get entries() {
        return [...this.props.entries]; // Return copy to prevent external mutation
    }
    get averageConsultationMinutes() {
        return this.props.averageConsultationMinutes;
    }
    // ==================== COMMANDS ====================
    /**
     * Add patient to queue
     * Business Rule: Check duplicates, calculate position, emit event
     */
    addPatient(patientId, appointmentId, priority, checkInTime = new Date()) {
        // Business Rule 1: Check if patient already in queue
        if (this.hasPatient(patientId)) {
            throw new Error(`Patient ${patientId} is already in the queue`);
        }
        // Business Rule 2: Calculate queue number based on priority
        const queueNumber = this.calculateNextQueueNumber(priority);
        // Create new entry
        const entry = QueueEntry_entity_1.QueueEntry.create(patientId, this.doctorId, queueNumber, priority, appointmentId);
        // Override check-in time if provided
        if (checkInTime) {
            entry.props.checkInTime = checkInTime;
        }
        // Add to collection
        this.props.entries.push(entry);
        // Business Rule 3: Reorder queue by priority
        this.reorderByPriority();
        // Calculate estimated wait time
        const estimatedWaitMinutes = this.calculateEstimatedWaitTime(entry.id);
        entry.updateEstimatedWait(estimatedWaitMinutes);
        // Update timestamp
        this.props.updatedAt = new Date();
        // Emit domain event
        this.addDomainEvent(new PatientJoinedQueueEvent_1.PatientJoinedQueueEvent(this.id, this.doctorId, patientId, appointmentId, queueNumber, priority // Convert enum to string
        ));
        return entry;
    }
    /**
     * Call next patient in queue
     * Business Rule: Priority-based selection, only waiting patients
     */
    callNext(calledBy) {
        // Get next waiting patient (priority-based)
        const nextPatient = this.getNextWaitingPatient();
        if (!nextPatient) {
            return null;
        }
        // Call patient
        nextPatient.call();
        // Update timestamp
        this.props.updatedAt = new Date();
        // Emit domain event
        this.addDomainEvent(new PatientCalledEvent_1.PatientCalledEvent(this.id, this.doctorId, nextPatient.patientId, nextPatient.appointmentId, nextPatient.queueNumber));
        return nextPatient;
    }
    /**
     * Remove patient from queue
     * Business Rule: Cancel entry, reorder remaining, emit event
     */
    removePatient(patientId, reason, removedBy) {
        const entry = this.findEntryByPatientId(patientId);
        if (!entry) {
            throw new Error(`Patient ${patientId} not found in queue`);
        }
        // Cancel entry
        entry.cancel();
        // Remove from collection
        this.props.entries = this.props.entries.filter(e => e.id !== entry.id);
        // Reorder remaining entries
        this.reorderQueueNumbers();
        // Recalculate wait times for remaining patients
        this.recalculateAllWaitTimes();
        // Update timestamp
        this.props.updatedAt = new Date();
        // Emit domain event
        this.addDomainEvent(new PatientLeftQueueEvent_1.PatientLeftQueueEvent(this.id, this.doctorId, patientId, entry.appointmentId, entry.queueNumber, reason));
        return entry;
    }
    /**
     * Start service for called patient
     */
    startService(patientId) {
        const entry = this.findEntryByPatientId(patientId);
        if (!entry) {
            throw new Error(`Patient ${patientId} not found in queue`);
        }
        entry.startService();
        this.props.updatedAt = new Date();
        return entry;
    }
    /**
     * Complete service for patient
     */
    completeService(patientId) {
        const entry = this.findEntryByPatientId(patientId);
        if (!entry) {
            throw new Error(`Patient ${patientId} not found in queue`);
        }
        entry.complete();
        this.props.updatedAt = new Date();
        // Recalculate wait times after completion
        this.recalculateAllWaitTimes();
        return entry;
    }
    // ==================== QUERIES ====================
    /**
     * Get queue status summary
     */
    getStatus() {
        return {
            totalWaiting: this.countByStatus(QueueEntry_entity_1.QueueStatus.WAITING),
            totalCalled: this.countByStatus(QueueEntry_entity_1.QueueStatus.CALLED),
            totalInProgress: this.countByStatus(QueueEntry_entity_1.QueueStatus.IN_PROGRESS),
            totalCompleted: this.countByStatus(QueueEntry_entity_1.QueueStatus.COMPLETED),
            totalCancelled: this.countByStatus(QueueEntry_entity_1.QueueStatus.CANCELLED),
            entries: this.props.entries.map(entry => ({
                queueId: entry.id,
                patientId: entry.patientId,
                appointmentId: entry.appointmentId,
                queueNumber: entry.queueNumber,
                status: entry.status,
                priority: entry.priority,
                checkInTime: entry.checkInTime,
                estimatedWaitMinutes: entry.estimatedWaitMinutes || 0
            }))
        };
    }
    /**
     * Get detailed patient position in queue
     * Returns full information including position, wait time, and entry details
     */
    getPatientPosition(patientId) {
        // Find the entry
        const entry = this.findEntryByPatientId(patientId);
        if (!entry) {
            return null;
        }
        // Calculate position among waiting patients
        const waitingEntries = this.props.entries
            .filter(e => e.status === QueueEntry_entity_1.QueueStatus.WAITING)
            .sort(this.compareEntries.bind(this));
        const position = waitingEntries.findIndex(e => e.patientId === patientId) + 1;
        const patientsAhead = Math.max(0, position - 1);
        return {
            patientId: entry.patientId,
            queueNumber: entry.queueNumber,
            position: position > 0 ? position : entry.queueNumber, // Use queueNumber if not in waiting list
            priority: entry.priority,
            status: entry.status,
            checkInTime: entry.checkInTime,
            estimatedWaitMinutes: entry.estimatedWaitMinutes || 0,
            patientsAhead
        };
    }
    /**
     * Get estimated wait time for patient
     */
    getEstimatedWaitTime(patientId) {
        const positionInfo = this.getPatientPosition(patientId);
        if (!positionInfo)
            return 0;
        // Calculate based on position and average consultation time
        // Position 1 = now, Position 2 = 1 * avgTime, etc.
        return (positionInfo.position - 1) * this.props.averageConsultationMinutes;
    }
    /**
     * Check if patient is in queue
     */
    hasPatient(patientId) {
        return this.props.entries.some(e => e.patientId === patientId && e.status !== QueueEntry_entity_1.QueueStatus.COMPLETED && e.status !== QueueEntry_entity_1.QueueStatus.CANCELLED);
    }
    /**
     * Get total active entries (not completed/cancelled)
     */
    getActiveCount() {
        return this.props.entries.filter(e => e.status !== QueueEntry_entity_1.QueueStatus.COMPLETED && e.status !== QueueEntry_entity_1.QueueStatus.CANCELLED).length;
    }
    // ==================== PRIVATE BUSINESS LOGIC ====================
    /**
     * Calculate next queue number based on priority
     * Emergency patients go first, others go to end
     */
    calculateNextQueueNumber(priority) {
        if (priority === QueueEntry_entity_1.QueuePriority.EMERGENCY) {
            // Emergency: Insert at front (will be reordered)
            return 1;
        }
        // Regular: Add to end
        const activeEntries = this.props.entries.filter(e => e.status !== QueueEntry_entity_1.QueueStatus.COMPLETED && e.status !== QueueEntry_entity_1.QueueStatus.CANCELLED);
        return activeEntries.length + 1;
    }
    /**
     * Reorder queue by priority and check-in time
     * Priority order: EMERGENCY > URGENT > NORMAL > LOW
     * Within same priority: FIFO (First In, First Out)
     */
    reorderByPriority() {
        // Only reorder active entries
        const activeEntries = this.props.entries.filter(e => e.status === QueueEntry_entity_1.QueueStatus.WAITING || e.status === QueueEntry_entity_1.QueueStatus.CALLED);
        // Sort by priority (higher first), then by check-in time (earlier first)
        activeEntries.sort(this.compareEntries.bind(this));
        // Assign new queue numbers
        activeEntries.forEach((entry, index) => {
            entry.updateQueueNumber(index + 1);
        });
    }
    /**
     * Compare two entries for sorting
     */
    compareEntries(a, b) {
        // Priority order mapping
        const priorityOrder = {
            [QueueEntry_entity_1.QueuePriority.EMERGENCY]: 0,
            [QueueEntry_entity_1.QueuePriority.URGENT]: 1,
            [QueueEntry_entity_1.QueuePriority.NORMAL]: 2,
            [QueueEntry_entity_1.QueuePriority.LOW]: 3
        };
        // First: Sort by priority
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) {
            return priorityDiff;
        }
        // Second: Sort by check-in time (FIFO)
        return a.checkInTime.getTime() - b.checkInTime.getTime();
    }
    /**
     * Reorder queue numbers after removal
     */
    reorderQueueNumbers() {
        const activeEntries = this.props.entries.filter(e => e.status === QueueEntry_entity_1.QueueStatus.WAITING || e.status === QueueEntry_entity_1.QueueStatus.CALLED);
        activeEntries.sort(this.compareEntries.bind(this));
        activeEntries.forEach((entry, index) => {
            entry.updateQueueNumber(index + 1);
        });
    }
    /**
     * Recalculate estimated wait times for all waiting patients
     */
    recalculateAllWaitTimes() {
        const waitingEntries = this.props.entries
            .filter(e => e.status === QueueEntry_entity_1.QueueStatus.WAITING)
            .sort(this.compareEntries.bind(this));
        waitingEntries.forEach((entry, index) => {
            const estimatedWait = index * this.props.averageConsultationMinutes;
            entry.updateEstimatedWait(estimatedWait);
        });
    }
    /**
     * Calculate estimated wait time for specific entry
     */
    calculateEstimatedWaitTime(entryId) {
        const entry = this.props.entries.find(e => e.id === entryId);
        if (!entry || entry.status !== QueueEntry_entity_1.QueueStatus.WAITING) {
            return 0;
        }
        // Get all waiting entries before this one
        const waitingBefore = this.props.entries
            .filter(e => e.status === QueueEntry_entity_1.QueueStatus.WAITING)
            .sort(this.compareEntries.bind(this))
            .findIndex(e => e.id === entryId);
        if (waitingBefore < 0)
            return 0;
        return waitingBefore * this.props.averageConsultationMinutes;
    }
    /**
     * Get next waiting patient (priority-based)
     */
    getNextWaitingPatient() {
        const waitingEntries = this.props.entries
            .filter(e => e.status === QueueEntry_entity_1.QueueStatus.WAITING)
            .sort(this.compareEntries.bind(this));
        return waitingEntries[0] || null;
    }
    /**
     * Find entry by patient ID
     */
    findEntryByPatientId(patientId) {
        return this.props.entries.find(e => e.patientId === patientId && e.status !== QueueEntry_entity_1.QueueStatus.COMPLETED && e.status !== QueueEntry_entity_1.QueueStatus.CANCELLED) || null;
    }
    /**
     * Count entries by status
     */
    countByStatus(status) {
        return this.props.entries.filter(e => e.status === status).length;
    }
    // ==================== BASE CLASS IMPLEMENTATIONS ====================
    containsPHI() {
        return true;
    }
    getPatientId() {
        // Aggregate contains multiple patients
        return null;
    }
    validateBusinessRules() {
        if (!this.props.doctorId) {
            throw new Error('Doctor ID is required');
        }
        if (!this.props.date) {
            throw new Error('Queue date is required');
        }
        if (this.props.averageConsultationMinutes <= 0) {
            throw new Error('Average consultation minutes must be positive');
        }
    }
    anonymize() {
        const anonymizedEntries = this.props.entries.map(entry => entry.anonymize());
        const anonymizedProps = {
            ...this.props,
            doctorId: '***REDACTED***',
            entries: anonymizedEntries
        };
        return Queue.reconstitute(anonymizedProps);
    }
    toPersistence() {
        return {
            id: this.props.id,
            doctor_id: this.props.doctorId,
            date: this.props.date.toISOString().split('T')[0],
            average_consultation_minutes: this.props.averageConsultationMinutes,
            created_at: this.props.createdAt.toISOString(),
            updated_at: this.props.updatedAt.toISOString(),
            // Entries are persisted separately
            entries: this.props.entries.map(e => e.toPersistence())
        };
    }
    // ==================== ABSTRACT METHOD IMPLEMENTATIONS ====================
    validateBusinessInvariants() {
        this.validateBusinessRules();
    }
    applyEvent(event) {
        // Event sourcing not implemented yet
        // Events are published but not used to reconstitute state
    }
    validate() {
        this.validateBusinessRules();
    }
}
exports.Queue = Queue;
//# sourceMappingURL=Queue.aggregate.js.map