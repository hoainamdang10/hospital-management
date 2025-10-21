import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';

export interface GetScheduleRequest {
  scheduleId: string;
}

export interface GetScheduleResponse {
  schedule: {
    scheduleId: string;
    tenantId: string;
    ownerService: string;
    ownerResourceType?: string;
    ownerResourceId?: string;
    policyTag?: string;
    scheduleType: string;
    timezone: string;
    startAtUtc?: string;
    endAtUtc?: string;
    cronExpr?: string;
    rrule?: string;
    topicOrCommand: string;
    payloadJson: any;
    maxRuns?: number;
    jitterMs: number;
    retryPolicy: any;
    dedupKey: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
  };
  nextRunAt?: string;
  totalRuns: number;
}

export class GetScheduleUseCase {
  constructor(
    private readonly scheduleRepo: IScheduleRepository,
    private readonly runRepo: IScheduleRunRepository
  ) {}

  async execute(request: GetScheduleRequest): Promise<GetScheduleResponse> {
    const schedule = await this.scheduleRepo.findById(request.scheduleId);

    if (!schedule) {
      throw new Error(`Schedule not found: ${request.scheduleId}`);
    }

    const props = schedule.getProps();
    const nextOccurrence = schedule.getNextOccurrence();
    const totalRuns = await this.runRepo.countByScheduleId(request.scheduleId);

    return {
      schedule: {
        scheduleId: props.scheduleId,
        tenantId: props.tenantId.getValue(),
        ownerService: props.ownerService,
        ownerResourceType: props.ownerResourceType,
        ownerResourceId: props.ownerResourceId,
        policyTag: props.policyTag,
        scheduleType: props.scheduleType.getValue(),
        timezone: props.timezone.getValue(),
        startAtUtc: props.startAtUtc?.toISOString(),
        endAtUtc: props.endAtUtc?.toISOString(),
        cronExpr: props.cronExpr?.getValue(),
        rrule: props.rrule?.getValue(),
        topicOrCommand: props.topicOrCommand,
        payloadJson: props.payloadJson,
        maxRuns: props.maxRuns,
        jitterMs: props.jitterMs,
        retryPolicy: props.retryPolicy.toJson(),
        dedupKey: props.dedupKey.getValue(),
        status: props.status,
        createdAt: props.createdAt.toISOString(),
        updatedAt: props.updatedAt.toISOString(),
        createdBy: props.createdBy
      },
      nextRunAt: nextOccurrence?.toISOString(),
      totalRuns
    };
  }
}

