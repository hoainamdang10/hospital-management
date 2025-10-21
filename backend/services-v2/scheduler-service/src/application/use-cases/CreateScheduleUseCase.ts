import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { Schedule } from '../../domain/aggregates/Schedule.aggregate';
import { ScheduleTypeVO } from '../../domain/value-objects/ScheduleType';
import { CronExpression } from '../../domain/value-objects/CronExpression';
import { RRuleExpression } from '../../domain/value-objects/RRuleExpression';
import { Timezone } from '../../domain/value-objects/Timezone';
import { TenantId } from '../../domain/value-objects/TenantId';
import { DedupKey } from '../../domain/value-objects/DedupKey';
import { RetryPolicy, RetryStrategy } from '../../domain/value-objects/RetryPolicy';

export interface CreateScheduleRequest {
  tenantId: string;
  ownerService: string;
  ownerResourceType?: string;
  ownerResourceId?: string;
  policyTag?: string;
  scheduleType: 'ONCE' | 'CRON' | 'RRULE';
  timezone?: string;
  startAtUtc?: string;
  endAtUtc?: string;
  cronExpr?: string;
  rrule?: string;
  topicOrCommand: string;
  payloadJson: any;
  maxRuns?: number;
  jitterMs?: number;
  retryPolicy?: {
    strategy: RetryStrategy;
    maxAttempts: number;
    baseMs: number;
    maxDelayMs?: number;
  };
  dedupKey: string;
  createdBy?: string;
}

export interface CreateScheduleResponse {
  scheduleId: string;
  status: string;
  nextRunAt?: string;
}

export class CreateScheduleUseCase {
  constructor(private readonly scheduleRepo: IScheduleRepository) {}

  async execute(request: CreateScheduleRequest): Promise<CreateScheduleResponse> {
    const tenantId = TenantId.create(request.tenantId);
    const dedupKey = DedupKey.create(request.dedupKey);

    const existing = await this.scheduleRepo.findByTenantAndDedupKey(tenantId, dedupKey);

    if (existing) {
      existing.update({
        payloadJson: request.payloadJson,
        endAtUtc: request.endAtUtc ? new Date(request.endAtUtc) : undefined,
        maxRuns: request.maxRuns
      });

      await this.scheduleRepo.update(existing);

      const nextOccurrence = existing.getNextOccurrence();

      return {
        scheduleId: existing.getScheduleId(),
        status: existing.getStatus(),
        nextRunAt: nextOccurrence?.toISOString()
      };
    }

    const scheduleType = ScheduleTypeVO.create(request.scheduleType);
    const timezone = request.timezone ? Timezone.create(request.timezone) : Timezone.utc();

    let cronExpr: CronExpression | undefined;
    let rrule: RRuleExpression | undefined;

    if (scheduleType.isCron()) {
      if (!request.cronExpr) {
        throw new Error('CRON expression required for CRON schedule');
      }
      cronExpr = CronExpression.create(request.cronExpr);
    }

    if (scheduleType.isRRule()) {
      if (!request.rrule) {
        throw new Error('RRULE required for RRULE schedule');
      }
      rrule = RRuleExpression.create(request.rrule);
    }

    const retryPolicy = request.retryPolicy
      ? RetryPolicy.create(request.retryPolicy)
      : RetryPolicy.default();

    const schedule = Schedule.create({
      tenantId,
      ownerService: request.ownerService,
      ownerResourceType: request.ownerResourceType,
      ownerResourceId: request.ownerResourceId,
      policyTag: request.policyTag,
      scheduleType,
      timezone,
      startAtUtc: request.startAtUtc ? new Date(request.startAtUtc) : undefined,
      endAtUtc: request.endAtUtc ? new Date(request.endAtUtc) : undefined,
      cronExpr,
      rrule,
      topicOrCommand: request.topicOrCommand,
      payloadJson: request.payloadJson,
      maxRuns: request.maxRuns,
      jitterMs: request.jitterMs || 0,
      retryPolicy,
      dedupKey,
      createdBy: request.createdBy
    });

    await this.scheduleRepo.save(schedule);

    const nextOccurrence = schedule.getNextOccurrence();

    return {
      scheduleId: schedule.getScheduleId(),
      status: schedule.getStatus(),
      nextRunAt: nextOccurrence?.toISOString()
    };
  }
}

