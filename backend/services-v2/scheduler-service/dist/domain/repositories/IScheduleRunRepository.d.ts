import { ScheduleRun, ScheduleRunStatus } from '../entities/ScheduleRun.entity';
export interface IScheduleRunRepository {
    save(run: ScheduleRun): Promise<void>;
    findById(runId: string): Promise<ScheduleRun | null>;
    findByScheduleId(scheduleId: string, limit?: number, offset?: number): Promise<ScheduleRun[]>;
    findDueRuns(beforeDate: Date, segment?: number, limit?: number): Promise<ScheduleRun[]>;
    /**
     * Atomically acquire due runs for execution
     *
     * Uses PostgreSQL FOR UPDATE SKIP LOCKED to prevent race conditions.
     *
     * @param beforeDate - Current time (for due_at_utc comparison)
     * @param workerId - Unique worker identifier
     * @param segment - Optional segment for horizontal scaling
     * @param limit - Maximum number of runs to claim
     * @param graceWindowMs - Grace period for late runs (default: 60s)
     * @param leaseTtlMs - Lock expiry time (default: 60s)
     * @returns Array of claimed runs (already locked)
     */
    acquireDueRuns(beforeDate: Date, workerId: string, segment?: number, limit?: number, graceWindowMs?: number, leaseTtlMs?: number): Promise<ScheduleRun[]>;
    findByStatus(status: ScheduleRunStatus, limit?: number): Promise<ScheduleRun[]>;
    update(run: ScheduleRun): Promise<void>;
    delete(runId: string): Promise<void>;
    deleteByScheduleId(scheduleId: string): Promise<void>;
    countByScheduleId(scheduleId: string): Promise<number>;
    /**
     * Delete completed runs older than specified days
     *
     * @param daysOld - Number of days (e.g., 30 = delete runs older than 30 days)
     * @returns Number of deleted runs
     */
    deleteOlderThan(daysOld: number): Promise<number>;
}
//# sourceMappingURL=IScheduleRunRepository.d.ts.map