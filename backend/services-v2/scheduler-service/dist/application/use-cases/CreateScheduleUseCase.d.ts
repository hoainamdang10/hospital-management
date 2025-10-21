import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { RetryStrategy } from '../../domain/value-objects/RetryPolicy';
export interface CreateScheduleRequest {
    tenantId: string;
    ownerService: string;
    ownerResourceType?: string;
    ownerResourceId?: string;
    policyTag?: string;
    scheduleType: 'ONCE' | 'CRON' | 'RRULE';
    timezone?: string;
    startAtUtc?: string;
    endAtUtc?: string;
    cronExpr?: string;
    rrule?: string;
    topicOrCommand: string;
    payloadJson: any;
    maxRuns?: number;
    jitterMs?: number;
    retryPolicy?: {
        strategy: RetryStrategy;
        maxAttempts: number;
        baseMs: number;
        maxDelayMs?: number;
    };
    dedupKey: string;
    createdBy?: string;
}
export interface CreateScheduleResponse {
    scheduleId: string;
    status: string;
    nextRunAt?: string;
}
export declare class CreateScheduleUseCase {
    private readonly scheduleRepo;
    constructor(scheduleRepo: IScheduleRepository);
    execute(request: CreateScheduleRequest): Promise<CreateScheduleResponse>;
}
//# sourceMappingURL=CreateScheduleUseCase.d.ts.map