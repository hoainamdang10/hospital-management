import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';

export interface GetScheduleRunsRequest {
  scheduleId: string;
  limit?: number;
  offset?: number;
}

export interface GetScheduleRunsResponse {
  runs: Array<{
    runId: string;
    scheduleId: string;
    tenantId: string;
    dueAtUtc: string;
    status: string;
    attempt: number;
    lockedBy?: string;
    lockedAtUtc?: string;
    startedAtUtc?: string;
    finishedAtUtc?: string;
    lastError?: string;
    segment?: number;
    createdAt: string;
  }>;
  total: number;
}

export class GetScheduleRunsUseCase {
  constructor(private readonly runRepo: IScheduleRunRepository) {}

  async execute(request: GetScheduleRunsRequest): Promise<GetScheduleRunsResponse> {
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

