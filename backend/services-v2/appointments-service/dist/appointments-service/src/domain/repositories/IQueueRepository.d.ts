/**
 * Queue Repository Interface - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * Refactored to work with Queue Aggregate instead of individual QueueEntry entities
 * Business logic moved from Repository to Aggregate
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { Queue } from '../aggregates/Queue.aggregate';
export interface IQueueRepository {
    /**
     * Save queue aggregate (with all entries)
     * Persists the entire queue state including all entries
     */
    save(queue: Queue): Promise<void>;
    /**
     * Find queue by ID
     * Loads queue aggregate with all its entries
     */
    findById(queueId: string): Promise<Queue | null>;
    /**
     * Find queue for doctor on specific date
     * Returns queue aggregate with all entries for that day
     */
    findByDoctorAndDate(doctorId: string, date: Date): Promise<Queue | null>;
    /**
     * Find or create queue for doctor on specific date
     * Helper method to get existing queue or create new one
     */
    findOrCreateByDoctorAndDate(doctorId: string, date: Date): Promise<Queue>;
    /**
     * Find queue by patient ID
     * Returns the queue that contains the patient (for current day)
     */
    findByPatient(patientId: string): Promise<Queue | null>;
    /**
     * Add appointment to rescheduling queue
     * Used by event consumers for rescheduling operations
     */
    addToReschedulingQueue(appointment: any): Promise<void>;
    /**
     * Add to pre-authorization tracking queue
     * Used by BillingEventConsumer for pre-auth tracking
     */
    addToPreAuthTrackingQueue(data: {
        authorizationId: string;
        patientId: string;
        appointmentId?: string;
        procedureCode: string;
        urgencyLevel: string;
        requestedAt: Date;
        status: string;
    }): Promise<void>;
    /**
     * Update pre-authorization tracking
     * Used by BillingEventConsumer for pre-auth status updates
     */
    updatePreAuthTracking(data: {
        authorizationId: string;
        status: string;
        approvedAt?: Date;
        approvedBy?: string;
        validUntil?: Date;
        deniedAt?: Date;
        denialReason?: string;
        appealProcess?: string;
    }): Promise<void>;
    /**
     * Add to billing resolution queue
     * Used by BillingEventConsumer for billing issues
     */
    addToBillingResolutionQueue(data: {
        authorizationId: string;
        appointmentId?: string;
        patientId: string;
        issueType: string;
        priority: string;
        addedAt: Date;
    }): Promise<void>;
    /**
     * Add to billing review queue
     * Used by BillingEventConsumer for billing reviews
     */
    addToBillingReviewQueue(data: {
        appointmentId: string;
        patientId: string;
        issueType: string;
        priority: string;
        addedAt: Date;
    }): Promise<void>;
    /**
     * Add to urgent processing queue
     * Used by BillingEventConsumer for urgent billing processing
     */
    addToUrgentProcessingQueue(data: {
        appointmentId: string;
        priority: string;
        reason: string;
        addedAt: Date;
    }): Promise<void>;
}
//# sourceMappingURL=IQueueRepository.d.ts.map