"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScheduleRoutes = createScheduleRoutes;
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateRequest_1 = require("../middleware/validateRequest");
const topicAllowlistMiddleware_1 = require("../middleware/topicAllowlistMiddleware");
const ScheduleDTO_1 = require("../dto/ScheduleDTO");
function createScheduleRoutes(controller) {
    const router = (0, express_1.Router)();
    // Create or update schedule by dedup key
    router.post('/schedules:createOrUpdateByDedup', authMiddleware_1.authMiddleware, (0, validateRequest_1.validateRequest)(ScheduleDTO_1.createScheduleSchema), topicAllowlistMiddleware_1.topicAllowlistMiddleware, (req, res) => controller.createOrUpdateByDedup(req, res));
    // Cancel schedule by owner
    router.post('/schedules:cancelByOwner', authMiddleware_1.authMiddleware, (0, validateRequest_1.validateRequest)(ScheduleDTO_1.cancelScheduleSchema), (req, res) => controller.cancelByOwner(req, res));
    // List schedules (NEW)
    router.get('/schedules', authMiddleware_1.authMiddleware, (req, res) => controller.listSchedules(req, res));
    // Get schedule by ID
    router.get('/schedules/:scheduleId', authMiddleware_1.authMiddleware, (req, res) => controller.getSchedule(req, res));
    // Update schedule (NEW)
    router.put('/schedules/:scheduleId', authMiddleware_1.authMiddleware, (req, res) => controller.updateSchedule(req, res));
    // Delete schedule (NEW)
    router.delete('/schedules/:scheduleId', authMiddleware_1.authMiddleware, (req, res) => controller.deleteSchedule(req, res));
    // Get schedule runs
    router.get('/schedules/:scheduleId/runs', authMiddleware_1.authMiddleware, (req, res) => controller.getScheduleRuns(req, res));
    // Run schedule now
    router.post('/schedules/:scheduleId:runNow', authMiddleware_1.authMiddleware, (req, res) => controller.runNow(req, res));
    // Get run by ID (NEW)
    router.get('/runs/:runId', authMiddleware_1.authMiddleware, (req, res) => controller.getRun(req, res));
    // Retry failed run (NEW)
    router.post('/runs/:runId/retry', authMiddleware_1.authMiddleware, (req, res) => controller.retryRun(req, res));
    // Health check
    router.get('/health', (req, res) => controller.healthCheck(req, res));
    return router;
}
//# sourceMappingURL=scheduleRoutes.js.map