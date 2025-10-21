"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleController = void 0;
class ScheduleController {
    constructor(createScheduleUseCase, cancelScheduleUseCase, getScheduleUseCase, getScheduleRunsUseCase, runNowUseCase, listSchedulesUseCase, updateScheduleUseCase, deleteScheduleUseCase, getRunUseCase, retryRunUseCase) {
        this.createScheduleUseCase = createScheduleUseCase;
        this.cancelScheduleUseCase = cancelScheduleUseCase;
        this.getScheduleUseCase = getScheduleUseCase;
        this.getScheduleRunsUseCase = getScheduleRunsUseCase;
        this.runNowUseCase = runNowUseCase;
        this.listSchedulesUseCase = listSchedulesUseCase;
        this.updateScheduleUseCase = updateScheduleUseCase;
        this.deleteScheduleUseCase = deleteScheduleUseCase;
        this.getRunUseCase = getRunUseCase;
        this.retryRunUseCase = retryRunUseCase;
    }
    async createOrUpdateByDedup(req, res) {
        try {
            const result = await this.createScheduleUseCase.execute(req.body);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('❌ Create schedule failed:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async cancelByOwner(req, res) {
        try {
            const result = await this.cancelScheduleUseCase.execute(req.body);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('❌ Cancel schedule failed:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const result = await this.getScheduleUseCase.execute({ scheduleId });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('❌ Get schedule failed:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async getScheduleRuns(req, res) {
        try {
            const { scheduleId } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit) : 100;
            const offset = req.query.offset ? parseInt(req.query.offset) : 0;
            const result = await this.getScheduleRunsUseCase.execute({
                scheduleId,
                limit,
                offset
            });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('❌ Get schedule runs failed:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async runNow(req, res) {
        try {
            const { scheduleId } = req.params;
            const result = await this.runNowUseCase.execute({ scheduleId });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('❌ Run now failed:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            else if (error instanceof Error && error.message.includes('not active')) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async healthCheck(req, res) {
        res.status(200).json({
            status: 'healthy',
            service: 'scheduler-service',
            version: '1.0.0',
            timestamp: new Date().toISOString()
        });
    }
    async listSchedules(req, res) {
        try {
            const { tenantId, ownerService, ownerResourceType, ownerResourceId, policyTag } = req.query;
            const limit = req.query.limit ? parseInt(req.query.limit) : 100;
            const offset = req.query.offset ? parseInt(req.query.offset) : 0;
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'tenantId is required'
                });
                return;
            }
            const result = await this.listSchedulesUseCase.execute({
                tenantId: tenantId,
                ownerService: ownerService,
                ownerResourceType: ownerResourceType,
                ownerResourceId: ownerResourceId,
                policyTag: policyTag,
                limit,
                offset
            });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('❌ List schedules failed:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async updateSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const { payloadJson, endAtUtc, maxRuns } = req.body;
            const result = await this.updateScheduleUseCase.execute({
                scheduleId,
                payloadJson,
                endAtUtc: endAtUtc ? new Date(endAtUtc) : undefined,
                maxRuns
            });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('❌ Update schedule failed:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async deleteSchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const result = await this.deleteScheduleUseCase.execute({ scheduleId });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('❌ Delete schedule failed:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async getRun(req, res) {
        try {
            const { runId } = req.params;
            const result = await this.getRunUseCase.execute({ runId });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('❌ Get run failed:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    async retryRun(req, res) {
        try {
            const { runId } = req.params;
            const result = await this.retryRunUseCase.execute({ runId });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('❌ Retry run failed:', error);
            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            else if (error instanceof Error && error.message.includes('Cannot retry')) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
}
exports.ScheduleController = ScheduleController;
//# sourceMappingURL=ScheduleController.js.map