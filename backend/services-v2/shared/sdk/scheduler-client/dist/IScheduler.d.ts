import { CreateScheduleRequest, ScheduleResponse, CancelByOwnerRequest, CancelResponse, RunResponse, GetScheduleRunsRequest, RunsResponse, HealthResponse } from './types';
export interface IScheduler {
    createOrUpdateByDedup(request: CreateScheduleRequest): Promise<ScheduleResponse>;
    cancelByOwner(request: CancelByOwnerRequest): Promise<CancelResponse>;
    getSchedule(scheduleId: string): Promise<ScheduleResponse>;
    runNow(scheduleId: string): Promise<RunResponse>;
    getScheduleRuns(request: GetScheduleRunsRequest): Promise<RunsResponse>;
    health(): Promise<HealthResponse>;
}
//# sourceMappingURL=IScheduler.d.ts.map