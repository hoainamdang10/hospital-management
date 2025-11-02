"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSchedulesUseCase = void 0;
const TenantId_1 = require("../../domain/value-objects/TenantId");
class ListSchedulesUseCase {
    constructor(scheduleRepo) {
        this.scheduleRepo = scheduleRepo;
    }
    async execute(request) {
        const { tenantId, ownerService, ownerResourceType, ownerResourceId, policyTag, limit = 100, offset = 0 } = request;
        // Validate tenant ID
        const tenant = TenantId_1.TenantId.create(tenantId);
        // Find schedules - if ownerService is provided, filter by owner; otherwise, get all schedules for tenant
        let schedules;
        if (ownerService) {
            // Filter by owner service
            schedules = await this.scheduleRepo.findByOwner(tenant, ownerService, ownerResourceType, ownerResourceId, policyTag);
            // Apply pagination manually (repository doesn't support pagination for findByOwner)
            schedules = schedules.slice(offset, offset + limit);
        }
        else {
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
exports.ListSchedulesUseCase = ListSchedulesUseCase;
//# sourceMappingURL=ListSchedulesUseCase.js.map