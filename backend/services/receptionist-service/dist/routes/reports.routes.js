"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reports_controller_1 = require("../controllers/reports.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const reportsController = new reports_controller_1.ReportsController();
router.get('/daily', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, reportsController.getDailyReport);
router.get('/weekly', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, reportsController.getWeeklyReport);
router.get('/patient-flow', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, reportsController.getPatientFlowReport);
exports.default = router;
//# sourceMappingURL=reports.routes.js.map