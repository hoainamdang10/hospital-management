"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelScheduleUseCase = void 0;
const TenantId_1 = require("../../domain/value-objects/TenantId");
class CancelScheduleUseCase {
    constructor(scheduleRepo, runRepo) {
        this.scheduleRepo = scheduleRepo;
        this.runRepo = runRepo;
    }
    async execute(request) {
        const tenantId = TenantId_1.TenantId.create(request.tenantId);
        const schedules = await this.scheduleRepo.findByOwner(tenantId, request.ownerService, request.ownerResourceType, request.ownerResourceId, request.policyTag);
        if (schedules.length === 0) {
            return {
                cancelledCount: 0,
                scheduleIds: []
            };
        }
        const scheduleIds = [];
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
exports.CancelScheduleUseCase = CancelScheduleUseCase;
//# sourceMappingURL=CancelScheduleUseCase.js.map