import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
export interface ListSchedulesRequest {
    tenantId: string;
    ownerService?: string;
    ownerResourceType?: string;
    ownerResourceId?: string;
    policyTag?: string;
    limit?: number;
    offset?: number;
}
export interface ListSchedulesResponse {
    schedules: Array<{
        scheduleId: string;
        tenantId: string;
        dedupKey: string;
        ownerService: string;
        ownerResourceType?: string;
        ownerResourceId?: string;
        policyTag?: string;
        scheduleType: string;
        timezone: string;
        startAtUtc?: string;
        endAtUtc?: string;
        topicOrCommand: string;
        payloadJson: any;
        maxRuns?: number;
        status: string;
        createdAt: string;
        updatedAt: string;
    }>;
    total: number;
    limit: number;
    offset: number;
}
export declare class ListSchedulesUseCase {
    private readonly scheduleRepo;
    constructor(scheduleRepo: IScheduleRepository);
    execute(request: ListSchedulesRequest): Promise<ListSchedulesResponse>;
}
//# sourceMappingURL=ListSchedulesUseCase.d.ts.map