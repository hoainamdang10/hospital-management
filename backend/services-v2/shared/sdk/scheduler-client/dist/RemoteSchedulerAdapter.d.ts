import { IScheduler } from './IScheduler';
import { CreateScheduleRequest, ScheduleResponse, CancelByOwnerRequest, CancelResponse, RunResponse, GetScheduleRunsRequest, RunsResponse, HealthResponse, SchedulerClientConfig } from './types';
export declare class RemoteSchedulerAdapter implements IScheduler {
    private client;
    private config;
    constructor(config: SchedulerClientConfig);
    private setupRequestInterceptor;
    private setupResponseInterceptor;
    createOrUpdateByDedup(request: CreateScheduleRequest): Promise<ScheduleResponse>;
    cancelByOwner(request: CancelByOwnerRequest): Promise<CancelResponse>;
    getSchedule(scheduleId: string): Promise<ScheduleResponse>;
    runNow(scheduleId: string): Promise<RunResponse>;
    getScheduleRuns(request: GetScheduleRunsRequest): Promise<RunsResponse>;
    health(): Promise<HealthResponse>;
    withIdempotencyKey(key: string): this;
    withCorrelationId(id: string): this;
}
//# sourceMappingURL=RemoteSchedulerAdapter.d.ts.map