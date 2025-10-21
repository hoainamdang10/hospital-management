import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
export interface UpdateScheduleRequest {
    scheduleId: string;
    payloadJson?: any;
    endAtUtc?: Date;
    maxRuns?: number;
}
export interface UpdateScheduleResponse {
    scheduleId: string;
    tenantId: string;
    dedupKey: string;
    ownerService: string;
    ownerResourceType: string;
    ownerResourceId: string;
    policyTag: string;
    topicOrCommand: string;
    payloadJson: any;
    scheduleType: string;
    status: string;
    endAtUtc: string | null;
    maxRuns: number | null;
    createdAtUtc: string;
    updatedAtUtc: string;
}
export declare class UpdateScheduleUseCase {
    private readonly scheduleRepo;
    constructor(scheduleRepo: IScheduleRepository);
    execute(request: UpdateScheduleRequest): Promise<UpdateScheduleResponse>;
}
//# sourceMappingURL=UpdateScheduleUseCase.d.ts.map