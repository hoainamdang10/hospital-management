"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const queue_controller_1 = require("../modules/receptionist/controllers/queue.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const queueController = new queue_controller_1.QueueController();
router.get('/status', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, queueController.getQueueStatus);
router.get('/live', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, queueController.getLiveQueue);
router.put('/priority', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, queueController.updateQueuePriority);
router.get('/wait-time', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, queueController.getEstimatedWaitTime);
router.get('/analytics', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, queueController.getQueueAnalytics);
router.post('/notifications', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, queueController.sendQueueNotifications);
exports.default = router;
//# sourceMappingURL=queue.routes.js.map