import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
export interface GetScheduleRunsRequest {
    scheduleId: string;
    limit?: number;
    offset?: number;
}
export interface GetScheduleRunsResponse {
    runs: Array<{
        runId: string;
        scheduleId: string;
        tenantId: string;
        dueAtUtc: string;
        status: string;
        attempt: number;
        lockedBy?: string;
        lockedAtUtc?: string;
        startedAtUtc?: string;
        finishedAtUtc?: string;
        lastError?: string;
        segment?: number;
        createdAt: string;
    }>;
    total: number;
}
export declare class GetScheduleRunsUseCase {
    private readonly runRepo;
    constructor(runRepo: IScheduleRunRepository);
    execute(request: GetScheduleRunsRequest): Promise<GetScheduleRunsResponse>;
}
//# sourceMappingURL=GetScheduleRunsUseCase.d.ts.map