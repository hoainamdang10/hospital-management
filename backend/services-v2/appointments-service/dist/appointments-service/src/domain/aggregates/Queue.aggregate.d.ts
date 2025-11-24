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
import { HealthcareAggregateRoot } from '../../../../shared/domain/base/aggregate-root';
import { QueueEntry, QueueStatus, QueuePriority } from '../entities/QueueEntry.entity';
export interface QueueProps {
    id: string;
    doctorId: string;
    date: Date;
    entries: QueueEntry[];
    averageConsultationMinutes: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface QueueStatusSummary {
    totalWaiting: number;
    totalCalled: number;
    totalInProgress: number;
    totalCompleted: number;
    totalCancelled: number;
    entries: Array<{
        queueId: string;
        patientId: string;
        appointmentId?: string;
        queueNumber: number;
        status: QueueStatus;
        priority: QueuePriority;
        checkInTime: Date;
        estimatedWaitMinutes: number;
    }>;
}
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
export declare class Queue extends HealthcareAggregateRoot<QueueProps> {
    private constructor();
    /**
     * Create new queue for doctor on specific date
     */
    static create(doctorId: string, date: Date, averageConsultationMinutes?: number): Queue;
    /**
     * Reconstitute from database
     */
    static reconstitute(props: QueueProps): Queue;
    get id(): string;
    get doctorId(): string;
    get date(): Date;
    get entries(): QueueEntry[];
    get averageConsultationMinutes(): number;
    /**
     * Add patient to queue
     * Business Rule: Check duplicates, calculate position, emit event
     */
    addPatient(patientId: string, appointmentId: string | undefined, priority: QueuePriority, checkInTime?: Date): QueueEntry;
    /**
     * Call next patient in queue
     * Business Rule: Priority-based selection, only waiting patients
     */
    callNext(calledBy: string): QueueEntry | null;
    /**
     * Remove patient from queue
     * Business Rule: Cancel entry, reorder remaining, emit event
     */
    removePatient(patientId: string, reason: string, removedBy: string): QueueEntry;
    /**
     * Start service for called patient
     */
    startService(patientId: string): QueueEntry;
    /**
     * Complete service for patient
     */
    completeService(patientId: string): QueueEntry;
    /**
     * Get queue status summary
     */
    getStatus(): QueueStatusSummary;
    /**
     * Get detailed patient position in queue
     * Returns full information including position, wait time, and entry details
     */
    getPatientPosition(patientId: string): {
        patientId: string;
        queueNumber: number;
        position: number;
        priority: QueuePriority;
        status: QueueStatus;
        checkInTime: Date;
        estimatedWaitMinutes: number;
        patientsAhead: number;
    } | null;
    /**
     * Get estimated wait time for patient
     */
    getEstimatedWaitTime(patientId: string): number;
    /**
     * Check if patient is in queue
     */
    hasPatient(patientId: string): boolean;
    /**
     * Get total active entries (not completed/cancelled)
     */
    getActiveCount(): number;
    /**
     * Calculate next queue number based on priority
     * Emergency patients go first, others go to end
     */
    private calculateNextQueueNumber;
    /**
     * Reorder queue by priority and check-in time
     * Priority order: EMERGENCY > URGENT > NORMAL > LOW
     * Within same priority: FIFO (First In, First Out)
     */
    private reorderByPriority;
    /**
     * Compare two entries for sorting
     */
    private compareEntries;
    /**
     * Reorder queue numbers after removal
     */
    private reorderQueueNumbers;
    /**
     * Recalculate estimated wait times for all waiting patients
     */
    private recalculateAllWaitTimes;
    /**
     * Calculate estimated wait time for specific entry
     */
    private calculateEstimatedWaitTime;
    /**
     * Get next waiting patient (priority-based)
     */
    private getNextWaitingPatient;
    /**
     * Find entry by patient ID
     */
    private findEntryByPatientId;
    /**
     * Count entries by status
     */
    private countByStatus;
    containsPHI(): boolean;
    getPatientId(): string | null;
    validateBusinessRules(): void;
    anonymize(): Queue;
    toPersistence(): any;
    protected validateBusinessInvariants(): void;
    protected applyEvent(event: any): void;
    validate(): void;
}
//# sourceMappingURL=Queue.aggregate.d.ts.map