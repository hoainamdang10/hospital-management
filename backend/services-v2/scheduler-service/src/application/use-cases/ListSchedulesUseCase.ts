import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { TenantId } from '../../domain/value-objects/TenantId';

export interface ListSchedulesRequest {
  tenantId: string;
  ownerService?: string;
  ownerResourceType?: string;
  ownerResourceId?: string;
  policyTag?: string;
  limit?: number;
  offset?: number;
}

export interface ListSchedulesResponse {
  schedules: Array<{
    scheduleId: string;
    tenantId: string;
    dedupKey: string;
    ownerService: string;
    ownerResourceType?: string;
    ownerResourceId?: string;
    policyTag?: string;
    scheduleType: string;
    timezone: string;
    startAtUtc?: string;
    endAtUtc?: string;
    topicOrCommand: string;
    payloadJson: any;
    maxRuns?: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export class ListSchedulesUseCase {
  constructor(private readonly scheduleRepo: IScheduleRepository) {}

  async execute(request: ListSchedulesRequest): Promise<ListSchedulesResponse> {
    const {
      tenantId,
      ownerService,
      ownerResourceType,
      ownerResourceId,
      policyTag,
      limit = 100,
      offset = 0
    } = request;

    // Validate tenant ID
    const tenant = TenantId.create(tenantId);

    // Find schedules - if ownerService is provided, filter by owner; otherwise, get all schedules for tenant
    let schedules: any[];

    if (ownerService) {
      // Filter by owner service
      schedules = await this.scheduleRepo.findByOwner(
        tenant,
        ownerService,
        ownerResourceType,
        ownerResourceId,
        policyTag
      );

      // Apply pagination manually (repository doesn't support pagination for findByOwner)
      schedules = schedules.slice(offset, offset + limit);
    } else {
      // Get all schedules for tenant (multi-service use case)
      schedules = await this.scheduleRepo.findByTenant(tenant, limit, offset);
    }

    // Map to response
    const schedulesData = schedules.map(schedule => {
      const props = schedule.getProps();
      return {
        scheduleId: schedule.getScheduleId(),
        tenantId: props.tenantId.getValue(),
        dedupKey: props.dedupKey.getValue(),
        ownerService: props.ownerService,
        ownerResourceType: props.ownerResourceType,
        ownerResourceId: props.ownerResourceId,
        policyTag: props.policyTag,
        scheduleType: props.scheduleType.getValue(),
        timezone: props.timezone.getValue(),
        startAtUtc: props.startAtUtc?.toISOString(),
        endAtUtc: props.endAtUtc?.toISOString(),
        topicOrCommand: props.topicOrCommand,
        payloadJson: props.payloadJson,
        maxRuns: props.maxRuns,
        status: props.status,
        createdAt: props.createdAt.toISOString(),
        updatedAt: props.updatedAt.toISOString()
      };
    });

    return {
      schedules: schedulesData,
      total: schedules.length,
      limit,
      offset
    };
  }
}

