"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateScheduleUseCase = void 0;
class UpdateScheduleUseCase {
    constructor(scheduleRepo) {
        this.scheduleRepo = scheduleRepo;
    }
    async execute(request) {
        const { scheduleId, payloadJson, endAtUtc, maxRuns } = request;
        // Find schedule
        const schedule = await this.scheduleRepo.findById(scheduleId);
        if (!schedule) {
            throw new Error(`Schedule ${scheduleId} not found`);
        }
        // Update schedule using domain method
        schedule.update({
            payloadJson,
            endAtUtc,
            maxRuns
        });
        // Save updated schedule
        await this.scheduleRepo.update(schedule);
        // Return updated schedule
        const updatedProps = schedule.getProps();
        return {
            scheduleId: schedule.getScheduleId(),
            tenantId: updatedProps.tenantId.getValue(),
            dedupKey: updatedProps.dedupKey.getValue(),
            ownerService: updatedProps.ownerService,
            ownerResourceType: updatedProps.ownerResourceType || '',
            ownerResourceId: updatedProps.ownerResourceId || '',
            policyTag: updatedProps.policyTag || '',
            topicOrCommand: updatedProps.topicOrCommand,
            payloadJson: updatedProps.payloadJson,
            scheduleType: updatedProps.scheduleType.getValue(),
            status: updatedProps.status,
            endAtUtc: updatedProps.endAtUtc?.toISOString() || null,
            maxRuns: updatedProps.maxRuns || null,
            createdAtUtc: updatedProps.createdAt.toISOString(),
            updatedAtUtc: updatedProps.updatedAt.toISOString()
        };
    }
}
exports.UpdateScheduleUseCase = UpdateScheduleUseCase;
//# sourceMappingURL=UpdateScheduleUseCase.js.map