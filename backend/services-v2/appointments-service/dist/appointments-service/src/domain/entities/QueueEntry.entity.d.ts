/**
 * Queue Entry Entity - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { HealthcareEntity } from '../../../../shared/domain/base/entity';
export declare enum QueueStatus {
    WAITING = "WAITING",
    CALLED = "CALLED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum QueuePriority {
    EMERGENCY = "EMERGENCY",
    URGENT = "URGENT",
    NORMAL = "NORMAL",
    LOW = "LOW"
}
export interface QueueEntryProps {
    id: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    queueNumber: number;
    priority: QueuePriority;
    status: QueueStatus;
    checkInTime: Date;
    calledTime?: Date;
    completedTime?: Date;
    serviceStartedAt?: Date;
    serviceCompletedAt?: Date;
    estimatedWaitMinutes?: number;
    createdAt: Date;
}
/**
 * Queue Entry Entity
 * Represents a patient in the waiting queue
 */
export declare class QueueEntry extends HealthcareEntity<QueueEntryProps> {
    private constructor();
    /**
     * Create new queue entry
     */
    static create(patientId: string, doctorId: string, queueNumber: number, priority: QueuePriority, appointmentId?: string): QueueEntry;
    /**
     * Reconstitute from database
     */
    static reconstitute(props: QueueEntryProps): QueueEntry;
    get id(): string;
    get patientId(): string;
    get doctorId(): string;
    get appointmentId(): string | undefined;
    get queueNumber(): number;
    get priority(): QueuePriority;
    get status(): QueueStatus;
    get checkInTime(): Date;
    get calledTime(): Date | undefined;
    get completedTime(): Date | undefined;
    get serviceStartedAt(): Date | undefined;
    get serviceCompletedAt(): Date | undefined;
    get estimatedWaitMinutes(): number | undefined;
    get createdAt(): Date;
    /**
     * Call patient
     */
    call(): void;
    /**
     * Start service (patient enters consultation)
     */
    startService(): void;
    /**
     * Complete service
     */
    complete(): void;
    /**
     * Cancel queue entry
     */
    cancel(): void;
    /**
     * Update estimated wait time
     */
    updateEstimatedWait(minutes: number): void;
    /**
     * Update queue number (when reordering)
     */
    updateQueueNumber(newNumber: number): void;
    /**
     * Check if patient is waiting
     */
    isWaiting(): boolean;
    /**
     * Check if patient has been called
     */
    isCalled(): boolean;
    /**
     * Check if service is in progress
     */
    isInProgress(): boolean;
    /**
     * Get wait time in minutes
     */
    getWaitTimeMinutes(): number;
    /**
     * Healthcare-specific: Contains PHI
     */
    containsPHI(): boolean;
    /**
     * Healthcare-specific: Get patient ID
     */
    getPatientId(): string | null;
    /**
     * Validate business rules (required by base class)
     */
    validateBusinessRules(): void;
    /**
     * Anonymize PHI data (required by base class)
     */
    anonymize(): QueueEntry;
    /**
     * Convert to persistence format (required by base class)
     */
    toPersistence(): any;
    /**
     * Validate entity (legacy method - kept for compatibility)
     */
    validate(): void;
}
//# sourceMappingURL=QueueEntry.entity.d.ts.map