"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunNowUseCase = void 0;
const ScheduleRun_entity_1 = require("../../domain/entities/ScheduleRun.entity");
class RunNowUseCase {
    constructor(scheduleRepo, runRepo) {
        this.scheduleRepo = scheduleRepo;
        this.runRepo = runRepo;
    }
    async execute(request) {
        const schedule = await this.scheduleRepo.findById(request.scheduleId);
        if (!schedule) {
            throw new Error(`Schedule not found: ${request.scheduleId}`);
        }
        if (!schedule.isActive()) {
            throw new Error(`Schedule is not active: ${schedule.getStatus()}`);
        }
        const now = new Date();
        const segment = this.calculateSegment(schedule.getScheduleId());
        const run = ScheduleRun_entity_1.ScheduleRun.create(schedule.getScheduleId(), schedule.getTenantId(), now, segment);
        await this.runRepo.save(run);
        const props = run.getProps();
        return {
            runId: props.runId,
            scheduleId: props.scheduleId,
            dueAtUtc: props.dueAtUtc.toISOString(),
            status: props.status
        };
    }
    calculateSegment(scheduleId) {
        let hash = 0;
        for (let i = 0; i < scheduleId.length; i++) {
            const char = scheduleId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash) % 10;
    }
}
exports.RunNowUseCase = RunNowUseCase;
//# sourceMappingURL=RunNowUseCase.js.map