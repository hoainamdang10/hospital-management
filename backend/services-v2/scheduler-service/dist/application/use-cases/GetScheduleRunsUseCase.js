"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetScheduleRunsUseCase = void 0;
class GetScheduleRunsUseCase {
    constructor(runRepo) {
        this.runRepo = runRepo;
    }
    async execute(request) {
        const limit = request.limit || 100;
        const offset = request.offset || 0;
        const runs = await this.runRepo.findByScheduleId(request.scheduleId, limit, offset);
        const total = await this.runRepo.countByScheduleId(request.scheduleId);
        return {
            runs: runs.map(run => {
                const props = run.getProps();
                return {
                    runId: props.runId,
                    scheduleId: props.scheduleId,
                    tenantId: props.tenantId.getValue(),
                    dueAtUtc: props.dueAtUtc.toISOString(),
                    status: props.status,
                    attempt: props.attempt,
                    lockedBy: props.lockedBy,
                    lockedAtUtc: props.lockedAtUtc?.toISOString(),
                    startedAtUtc: props.startedAtUtc?.toISOString(),
                    finishedAtUtc: props.finishedAtUtc?.toISOString(),
                    lastError: props.lastError,
                    segment: props.segment,
                    createdAt: props.createdAt.toISOString()
                };
            }),
            total
        };
    }
}
exports.GetScheduleRunsUseCase = GetScheduleRunsUseCase;
//# sourceMappingURL=GetScheduleRunsUseCase.js.map