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
}
//# sourceMappingURL=IQueueRepository.d.ts.map