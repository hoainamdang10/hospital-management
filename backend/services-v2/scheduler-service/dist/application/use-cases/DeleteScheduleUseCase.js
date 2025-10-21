"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteScheduleUseCase = void 0;
class DeleteScheduleUseCase {
    constructor(scheduleRepo, runRepo) {
        this.scheduleRepo = scheduleRepo;
        this.runRepo = runRepo;
    }
    async execute(request) {
        const { scheduleId } = request;
        // Find schedule
        const schedule = await this.scheduleRepo.findById(scheduleId);
        if (!schedule) {
            throw new Error(`Schedule ${scheduleId} not found`);
        }
        // Delete all runs associated with this schedule
        await this.runRepo.deleteByScheduleId(scheduleId);
        // Delete schedule
        await this.scheduleRepo.delete(scheduleId);
        return {
            scheduleId,
            deleted: true
        };
    }
}
exports.DeleteScheduleUseCase = DeleteScheduleUseCase;
//# sourceMappingURL=DeleteScheduleUseCase.js.map