import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
export interface RetryRunRequest {
    runId: string;
}
export interface RetryRunResponse {
    runId: string;
    scheduleId: string;
    status: string;
    attempt: number;
    retriedAtUtc: string;
}
export declare class RetryRunUseCase {
    private readonly runRepo;
    constructor(runRepo: IScheduleRunRepository);
    execute(request: RetryRunRequest): Promise<RetryRunResponse>;
}
//# sourceMappingURL=RetryRunUseCase.d.ts.map