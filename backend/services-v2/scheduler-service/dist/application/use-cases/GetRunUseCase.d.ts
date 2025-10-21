import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
export interface GetRunRequest {
    runId: string;
}
export interface GetRunResponse {
    runId: string;
    scheduleId: string;
    tenantId: string;
    dueAtUtc: string;
    status: string;
    segment: number | null;
    lockedBy: string | null;
    lockedAtUtc: string | null;
    startedAtUtc: string | null;
    finishedAtUtc: string | null;
    lastError: string | null;
    attempt: number;
    createdAtUtc: string;
    updatedAtUtc: string;
}
export declare class GetRunUseCase {
    private readonly runRepo;
    constructor(runRepo: IScheduleRunRepository);
    execute(request: GetRunRequest): Promise<GetRunResponse>;
}
//# sourceMappingURL=GetRunUseCase.d.ts.map