import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
export interface GetScheduleRequest {
    scheduleId: string;
}
export interface GetScheduleResponse {
    schedule: {
        scheduleId: string;
        tenantId: string;
        ownerService: string;
        ownerResourceType?: string;
        ownerResourceId?: string;
        policyTag?: string;
        scheduleType: string;
        timezone: string;
        startAtUtc?: string;
        endAtUtc?: string;
        cronExpr?: string;
        rrule?: string;
        topicOrCommand: string;
        payloadJson: any;
        maxRuns?: number;
        jitterMs: number;
        retryPolicy: any;
        dedupKey: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        createdBy?: string;
    };
    nextRunAt?: string;
    totalRuns: number;
}
export declare class GetScheduleUseCase {
    private readonly scheduleRepo;
    private readonly runRepo;
    constructor(scheduleRepo: IScheduleRepository, runRepo: IScheduleRunRepository);
    execute(request: GetScheduleRequest): Promise<GetScheduleResponse>;
}
//# sourceMappingURL=GetScheduleUseCase.d.ts.map