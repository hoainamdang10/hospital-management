import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';

export interface RetryRunRequest {
  runId: string;
}

export interface RetryRunResponse {
  runId: string;
  scheduleId: string;
  status: string;
  attempt: number;
  retriedAtUtc: string;
}

export class RetryRunUseCase {
  constructor(private readonly runRepo: IScheduleRunRepository) {}

  async execute(request: RetryRunRequest): Promise<RetryRunResponse> {
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

