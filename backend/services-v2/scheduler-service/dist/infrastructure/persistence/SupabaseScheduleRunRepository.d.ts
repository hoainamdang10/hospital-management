import { SupabaseClient } from '@supabase/supabase-js';
import { IScheduleRunRepository, ExecuteRunTransactionalParams, ExecuteRunTransactionalResult } from '../../domain/repositories/IScheduleRunRepository';
import { ScheduleRun, ScheduleRunStatus } from '../../domain/entities/ScheduleRun.entity';
export declare class SupabaseScheduleRunRepository implements IScheduleRunRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    save(run: ScheduleRun): Promise<void>;
    findById(runId: string): Promise<ScheduleRun | null>;
    findByScheduleId(scheduleId: string, limit?: number, offset?: number): Promise<ScheduleRun[]>;
    findDueRuns(beforeDate: Date, segment?: number, limit?: number): Promise<ScheduleRun[]>;
    acquireDueRuns(beforeDate: Date, workerId: string, segment?: number, limit?: number, graceWindowMs?: number, leaseTtlMs?: number): Promise<ScheduleRun[]>;
    executeRunTransactional(params: ExecuteRunTransactionalParams): Promise<ExecuteRunTransactionalResult>;
    findByStatus(status: ScheduleRunStatus, limit?: number): Promise<ScheduleRun[]>;
    update(run: ScheduleRun): Promise<void>;
    delete(runId: string): Promise<void>;
    deleteByScheduleId(scheduleId: string): Promise<void>;
    countByScheduleId(scheduleId: string): Promise<number>;
    private toDomain;
    deleteOlderThan(daysOld: number): Promise<number>;
    private toRow;
}
//# sourceMappingURL=SupabaseScheduleRunRepository.d.ts.map