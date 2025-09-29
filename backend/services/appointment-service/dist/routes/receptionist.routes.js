"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const receptionist_controller_1 = require("../modules/receptionist/controllers/receptionist.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const receptionistController = new receptionist_controller_1.ReceptionistController();
router.get('/profile', auth_middleware_1.authMiddleware, receptionistController.getMyProfile);
router.get('/:receptionistId', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, receptionistController.getReceptionistById);
router.get('/:receptionistId/performance', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, receptionistController.getPerformanceMetrics);
router.get('/:receptionistId/schedule', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, receptionistController.getWorkSchedule);
router.put('/:receptionistId/status', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, receptionistController.updateStatus);
router.get('/dashboard/stats', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, receptionistController.getDashboardStats);
exports.default = router;
//# sourceMappingURL=receptionist.routes.js.map