import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';

export interface GetRunRequest {
  runId: string;
}

export interface GetRunResponse {
  runId: string;
  scheduleId: string;
  tenantId: string;
  dueAtUtc: string;
  status: string;
  segment: number | null;
  lockedBy: string | null;
  lockedAtUtc: string | null;
  startedAtUtc: string | null;
  finishedAtUtc: string | null;
  lastError: string | null;
  attempt: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export class GetRunUseCase {
  constructor(private readonly runRepo: IScheduleRunRepository) {}

  async execute(request: GetRunRequest): Promise<GetRunResponse> {
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

