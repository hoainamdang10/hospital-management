import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
export interface CancelScheduleRequest {
    tenantId: string;
    ownerService: string;
    ownerResourceType?: string;
    ownerResourceId?: string;
    policyTag?: string;
    reason?: string;
}
export interface CancelScheduleResponse {
    cancelledCount: number;
    scheduleIds: string[];
}
export declare class CancelScheduleUseCase {
    private readonly scheduleRepo;
    private readonly runRepo;
    constructor(scheduleRepo: IScheduleRepository, runRepo: IScheduleRunRepository);
    execute(request: CancelScheduleRequest): Promise<CancelScheduleResponse>;
}
//# sourceMappingURL=CancelScheduleUseCase.d.ts.map