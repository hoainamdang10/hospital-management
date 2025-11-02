/**
 * Supabase Queue Repository - Infrastructure Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * Refactored to work with Queue Aggregate
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { Queue } from '../../domain/aggregates/Queue.aggregate';
export declare class SupabaseQueueRepository implements IQueueRepository {
    private supabase;
    private readonly queuesTable;
    private readonly entriesTable;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Save Queue Aggregate (persist entire aggregate with all entries)
     */
    save(queue: Queue): Promise<void>;
    /**
     * Find Queue Aggregate by ID
     */
    findById(id: string): Promise<Queue | null>;
    /**
     * Find Queue Aggregate by doctor and date
     */
    findByDoctorAndDate(doctorId: string, date: Date): Promise<Queue | null>;
    /**
     * Find or create Queue Aggregate by doctor and date
     */
    findOrCreateByDoctorAndDate(doctorId: string, date: Date): Promise<Queue>;
    /**
     * Find Queue by patient ID
     * Returns the queue that contains the patient (for current day)
     */
    findByPatient(patientId: string): Promise<Queue | null>;
    /**
     * Reconstitute Queue Aggregate from database rows
     */
    private toDomainAggregate;
}
//# sourceMappingURL=SupabaseQueueRepository.d.ts.map