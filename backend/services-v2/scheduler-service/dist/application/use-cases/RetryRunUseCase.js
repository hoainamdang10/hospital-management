"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryRunUseCase = void 0;
class RetryRunUseCase {
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
        // Check if run is in FAILED status
        const props = run.getProps();
        if (props.status !== 'FAILED') {
            throw new Error(`Cannot retry run ${runId}: status is ${props.status}, expected FAILED`);
        }
        // Reset run to DUE status for retry
        run.retry();
        // Save updated run
        await this.runRepo.update(run);
        // Return response
        const updatedProps = run.getProps();
        return {
            runId: run.getRunId(),
            scheduleId: updatedProps.scheduleId,
            status: updatedProps.status,
            attempt: updatedProps.attempt,
            retriedAtUtc: new Date().toISOString()
        };
    }
}
exports.RetryRunUseCase = RetryRunUseCase;
//# sourceMappingURL=RetryRunUseCase.js.map