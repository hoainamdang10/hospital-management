/**
 * Supabase implementation of Rescheduling Queue Repository
 * Handles appointment conflict resolution with medical compliance
 */
import { IReschedulingQueueRepository, ReschedulingQueueEntry, CreateReschedulingEntryRequest, UpdatePatientResponseRequest, ReschedulingQueueQuery, ReschedulingStatus } from '../../domain/interfaces/IReschedulingQueueRepository';
export declare class SupabaseReschedulingQueueRepository implements IReschedulingQueueRepository {
    private supabase;
    private readonly tableName;
    constructor(supabaseUrl: string, supabaseKey: string);
    addToQueue(request: CreateReschedulingEntryRequest): Promise<ReschedulingQueueEntry>;
    findById(entryId: string): Promise<ReschedulingQueueEntry | null>;
    findByAppointmentId(appointmentId: string): Promise<ReschedulingQueueEntry | null>;
    findByDoctorId(doctorId: string, query?: ReschedulingQueueQuery): Promise<ReschedulingQueueEntry[]>;
    findPendingEntries(query?: ReschedulingQueueQuery): Promise<ReschedulingQueueEntry[]>;
    findExpiredEntries(): Promise<ReschedulingQueueEntry[]>;
    updatePatientResponse(request: UpdatePatientResponseRequest): Promise<ReschedulingQueueEntry>;
    updateStatus(entryId: string, status: ReschedulingStatus, updatedBy?: string): Promise<ReschedulingQueueEntry>;
    markNotificationSent(entryId: string): Promise<ReschedulingQueueEntry>;
    completeRescheduling(entryId: string, newAppointmentId: string, resolvedBy: string): Promise<ReschedulingQueueEntry>;
    removeFromQueue(entryId: string): Promise<void>;
    getQueueStatistics(): Promise<{
        totalEntries: number;
        pendingReschedules: number;
        searchingAlternatives: number;
        notified: number;
        completed: number;
        expired: number;
        averageResolutionTimeHours: number;
    }>;
    private mapToReschedulingQueueEntry;
}
//# sourceMappingURL=SupabaseReschedulingQueueRepository.d.ts.map