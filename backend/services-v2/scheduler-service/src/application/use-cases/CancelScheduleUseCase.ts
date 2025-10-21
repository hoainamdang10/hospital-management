import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
import { TenantId } from '../../domain/value-objects/TenantId';

export interface CancelScheduleRequest {
  tenantId: string;
  ownerService: string;
  ownerResourceType?: string;
  ownerResourceId?: string;
  policyTag?: string;
  reason?: string;
}

export interface CancelScheduleResponse {
  cancelledCount: number;
  scheduleIds: string[];
}

export class CancelScheduleUseCase {
  constructor(
    private readonly scheduleRepo: IScheduleRepository,
    private readonly runRepo: IScheduleRunRepository
  ) {}

  async execute(request: CancelScheduleRequest): Promise<CancelScheduleResponse> {
    const tenantId = TenantId.create(request.tenantId);

    const schedules = await this.scheduleRepo.findByOwner(
      tenantId,
      request.ownerService,
      request.ownerResourceType,
      request.ownerResourceId,
      request.policyTag
    );

    if (schedules.length === 0) {
      return {
        cancelledCount: 0,
        scheduleIds: []
      };
    }

    const scheduleIds: string[] = [];

    for (const schedule of schedules) {
      schedule.cancel(request.reason);
      await this.scheduleRepo.update(schedule);

      await this.runRepo.deleteByScheduleId(schedule.getScheduleId());

      scheduleIds.push(schedule.getScheduleId());
    }

    return {
      cancelledCount: schedules.length,
      scheduleIds
    };
  }
}

