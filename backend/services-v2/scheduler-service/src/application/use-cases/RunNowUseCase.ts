import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
import { ScheduleRun } from '../../domain/entities/ScheduleRun.entity';

export interface RunNowRequest {
  scheduleId: string;
}

export interface RunNowResponse {
  runId: string;
  scheduleId: string;
  dueAtUtc: string;
  status: string;
}

export class RunNowUseCase {
  constructor(
    private readonly scheduleRepo: IScheduleRepository,
    private readonly runRepo: IScheduleRunRepository
  ) {}

  async execute(request: RunNowRequest): Promise<RunNowResponse> {
    const schedule = await this.scheduleRepo.findById(request.scheduleId);

    if (!schedule) {
      throw new Error(`Schedule not found: ${request.scheduleId}`);
    }

    if (!schedule.isActive()) {
      throw new Error(`Schedule is not active: ${schedule.getStatus()}`);
    }

    const now = new Date();

    const segment = this.calculateSegment(schedule.getScheduleId());

    const run = ScheduleRun.create(
      schedule.getScheduleId(),
      schedule.getTenantId(),
      now,
      segment
    );

    await this.runRepo.save(run);

    const props = run.getProps();

    return {
      runId: props.runId,
      scheduleId: props.scheduleId,
      dueAtUtc: props.dueAtUtc.toISOString(),
      status: props.status
    };
  }

  private calculateSegment(scheduleId: string): number {
    let hash = 0;
    for (let i = 0; i < scheduleId.length; i++) {
      const char = scheduleId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 10;
  }
}

