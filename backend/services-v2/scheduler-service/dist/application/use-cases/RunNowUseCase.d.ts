import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
export interface RunNowRequest {
    scheduleId: string;
}
export interface RunNowResponse {
    runId: string;
    scheduleId: string;
    dueAtUtc: string;
    status: string;
}
export declare class RunNowUseCase {
    private readonly scheduleRepo;
    private readonly runRepo;
    constructor(scheduleRepo: IScheduleRepository, runRepo: IScheduleRunRepository);
    execute(request: RunNowRequest): Promise<RunNowResponse>;
    private calculateSegment;
}
//# sourceMappingURL=RunNowUseCase.d.ts.map