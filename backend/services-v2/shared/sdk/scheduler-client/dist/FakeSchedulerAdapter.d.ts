import { IScheduler } from './IScheduler';
import { CreateScheduleRequest, ScheduleResponse, CancelByOwnerRequest, CancelResponse, RunResponse, GetScheduleRunsRequest, RunsResponse, HealthResponse } from './types';
export interface FakeSchedulerConfig {
    delay?: number;
    simulateErrors?: {
        createOrUpdateByDedup?: 'VALIDATION_ERROR' | 'FORBIDDEN' | 'RATE_LIMITED' | 'INTERNAL_ERROR';
        cancelByOwner?: 'VALIDATION_ERROR' | 'FORBIDDEN' | 'INTERNAL_ERROR';
        getSchedule?: 'NOT_FOUND' | 'FORBIDDEN' | 'INTERNAL_ERROR';
        runNow?: 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'INTERNAL_ERROR';
        getScheduleRuns?: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'FORBIDDEN' | 'INTERNAL_ERROR';
    };
}
export declare class FakeSchedulerAdapter implements IScheduler {
    private schedules;
    private runs;
    private dedupIndex;
    private config;
    constructor(config?: FakeSchedulerConfig);
    private delay;
    createOrUpdateByDedup(request: CreateScheduleRequest): Promise<ScheduleResponse>;
    cancelByOwner(request: CancelByOwnerRequest): Promise<CancelResponse>;
    getSchedule(scheduleId: string): Promise<ScheduleResponse>;
    runNow(scheduleId: string): Promise<RunResponse>;
    getScheduleRuns(request: GetScheduleRunsRequest): Promise<RunsResponse>;
    health(): Promise<HealthResponse>;
    reset(): void;
    getAllSchedules(): ScheduleResponse[];
}
//# sourceMappingURL=FakeSchedulerAdapter.d.ts.map