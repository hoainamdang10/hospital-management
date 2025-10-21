"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRunUseCase = void 0;
class GetRunUseCase {
    constructor(runRepo) {
        this.runRepo = runRepo;
    }
    async execute(request) {
        const { runId } = request;
        // Find run
        const run = await this.runRepo.findById(runId);
        if (!run) {
            throw new Error(`Run ${runId} not found`);
        }
        // Map to response
        const props = run.getProps();
        return {
            runId: run.getRunId(),
            scheduleId: props.scheduleId,
            tenantId: props.tenantId.getValue(),
            dueAtUtc: props.dueAtUtc.toISOString(),
            status: props.status,
            segment: props.segment ?? null,
            lockedBy: props.lockedBy || null,
            lockedAtUtc: props.lockedAtUtc?.toISOString() || null,
            startedAtUtc: props.startedAtUtc?.toISOString() || null,
            finishedAtUtc: props.finishedAtUtc?.toISOString() || null,
            lastError: props.lastError || null,
            attempt: props.attempt,
            createdAtUtc: props.createdAt.toISOString(),
            updatedAtUtc: props.createdAt.toISOString() // Note: ScheduleRun doesn't have updatedAt
        };
    }
}
exports.GetRunUseCase = GetRunUseCase;
//# sourceMappingURL=GetRunUseCase.js.map