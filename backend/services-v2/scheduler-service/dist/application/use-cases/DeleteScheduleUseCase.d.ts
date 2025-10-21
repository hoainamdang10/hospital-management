import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
export interface DeleteScheduleRequest {
    scheduleId: string;
}
export interface DeleteScheduleResponse {
    scheduleId: string;
    deleted: boolean;
}
export declare class DeleteScheduleUseCase {
    private readonly scheduleRepo;
    private readonly runRepo;
    constructor(scheduleRepo: IScheduleRepository, runRepo: IScheduleRunRepository);
    execute(request: DeleteScheduleRequest): Promise<DeleteScheduleResponse>;
}
//# sourceMappingURL=DeleteScheduleUseCase.d.ts.map