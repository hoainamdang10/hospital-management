import { Request, Response } from 'express';
import { CreateScheduleUseCase, CancelScheduleUseCase, GetScheduleUseCase, GetScheduleRunsUseCase, RunNowUseCase, ListSchedulesUseCase, UpdateScheduleUseCase, DeleteScheduleUseCase, GetRunUseCase, RetryRunUseCase } from '../../application/use-cases';
export declare class ScheduleController {
    private readonly createScheduleUseCase;
    private readonly cancelScheduleUseCase;
    private readonly getScheduleUseCase;
    private readonly getScheduleRunsUseCase;
    private readonly runNowUseCase;
    private readonly listSchedulesUseCase;
    private readonly updateScheduleUseCase;
    private readonly deleteScheduleUseCase;
    private readonly getRunUseCase;
    private readonly retryRunUseCase;
    constructor(createScheduleUseCase: CreateScheduleUseCase, cancelScheduleUseCase: CancelScheduleUseCase, getScheduleUseCase: GetScheduleUseCase, getScheduleRunsUseCase: GetScheduleRunsUseCase, runNowUseCase: RunNowUseCase, listSchedulesUseCase: ListSchedulesUseCase, updateScheduleUseCase: UpdateScheduleUseCase, deleteScheduleUseCase: DeleteScheduleUseCase, getRunUseCase: GetRunUseCase, retryRunUseCase: RetryRunUseCase);
    createOrUpdateByDedup(req: Request, res: Response): Promise<void>;
    cancelByOwner(req: Request, res: Response): Promise<void>;
    getSchedule(req: Request, res: Response): Promise<void>;
    getScheduleRuns(req: Request, res: Response): Promise<void>;
    runNow(req: Request, res: Response): Promise<void>;
    healthCheck(req: Request, res: Response): Promise<void>;
    listSchedules(req: Request, res: Response): Promise<void>;
    updateSchedule(req: Request, res: Response): Promise<void>;
    deleteSchedule(req: Request, res: Response): Promise<void>;
    getRun(req: Request, res: Response): Promise<void>;
    retryRun(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ScheduleController.d.ts.map