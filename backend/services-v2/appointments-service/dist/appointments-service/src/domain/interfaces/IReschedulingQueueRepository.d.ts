/**
 * Interface for Rescheduling Queue Repository
 * Handles appointment conflict resolution and rescheduling workflows
 * Follows medical compliance and audit trail requirements
 */
export interface ReschedulingQueueEntry {
    id: string;
    appointmentId: string;
    conflictReason: string;
    conflictDetails?: Record<string, any>;
    status: ReschedulingStatus;
    priority: ReschedulingPriority;
    notificationSent: boolean;
    notificationSentAt?: Date;
    patientResponse?: PatientResponse;
    patientRespondedAt?: Date;
    rescheduledAppointmentId?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}
export declare enum ReschedulingStatus {
    PENDING_RESCHEDULE = "PENDING_RESCHEDULE",
    SEARCHING_ALTERNATIVES = "SEARCHING_ALTERNATIVES",
    NOTIFIED = "NOTIFIED",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    COMPLETED = "COMPLETED",
    EXPIRED = "EXPIRED"
}
export declare enum PatientResponse {
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    PENDING = "PENDING",
    NO_RESPONSE = "NO_RESPONSE"
}
export declare enum ReschedulingPriority {
    EMERGENCY = "EMERGENCY",
    URGENT = "URGENT",
    NORMAL = "NORMAL",
    LOW = "LOW"
}
export interface CreateReschedulingEntryRequest {
    appointmentId: string;
    conflictReason: string;
    conflictDetails?: Record<string, any>;
    priority?: ReschedulingPriority;
    expiresAt?: Date;
    createdBy?: string;
}
export interface UpdatePatientResponseRequest {
    entryId: string;
    patientResponse: PatientResponse;
    respondedBy?: string;
}
export interface ReschedulingQueueQuery {
    doctorId?: string;
    status?: ReschedulingStatus;
    priority?: ReschedulingPriority;
    patientResponse?: PatientResponse;
    expiresBefore?: Date;
    createdAfter?: Date;
    limit?: number;
    offset?: number;
}
export interface IReschedulingQueueRepository {
    /**
     * Add appointment to rescheduling queue
     * Used when conflicts are detected or staff becomes unavailable
     */
    addToQueue(request: CreateReschedulingEntryRequest): Promise<ReschedulingQueueEntry>;
    /**
     * Find entry by ID
     */
    findById(entryId: string): Promise<ReschedulingQueueEntry | null>;
    /**
     * Find entry by appointment ID
     */
    findByAppointmentId(appointmentId: string): Promise<ReschedulingQueueEntry | null>;
    /**
     * Find entries by doctor ID
     * Used by staff event consumers
     */
    findByDoctorId(doctorId: string, query?: ReschedulingQueueQuery): Promise<ReschedulingQueueEntry[]>;
    /**
     * Find pending rescheduling entries
     * Used by background processors
     */
    findPendingEntries(query?: ReschedulingQueueQuery): Promise<ReschedulingQueueEntry[]>;
    /**
     * Find expired entries that need cleanup
     */
    findExpiredEntries(): Promise<ReschedulingQueueEntry[]>;
    /**
     * Update patient response
     * Used when patient accepts/rejects rescheduling notification
     */
    updatePatientResponse(request: UpdatePatientResponseRequest): Promise<ReschedulingQueueEntry>;
    /**
     * Update entry status
     * Used for workflow state transitions
     */
    updateStatus(entryId: string, status: ReschedulingStatus, updatedBy?: string): Promise<ReschedulingQueueEntry>;
    /**
     * Mark notification as sent
     */
    markNotificationSent(entryId: string): Promise<ReschedulingQueueEntry>;
    /**
     * Complete rescheduling with new appointment
     */
    completeRescheduling(entryId: string, newAppointmentId: string, resolvedBy: string): Promise<ReschedulingQueueEntry>;
    /**
     * Remove entry from queue
     * Used for cleanup or when rescheduling is cancelled
     */
    removeFromQueue(entryId: string): Promise<void>;
    /**
     * Get queue statistics
     * Used for monitoring and reporting
     */
    getQueueStatistics(): Promise<{
        totalEntries: number;
        pendingReschedules: number;
        searchingAlternatives: number;
        notified: number;
        completed: number;
        expired: number;
        averageResolutionTimeHours: number;
    }>;
}
//# sourceMappingURL=IReschedulingQueueRepository.d.ts.map