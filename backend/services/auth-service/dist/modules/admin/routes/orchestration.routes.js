"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orchestration_controller_1 = require("../controllers/orchestration.controller");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const router = express_1.default.Router();
const orchestrationController = new orchestration_controller_1.AdminOrchestrationController();
orchestrationController.initialize().catch(error => {
    console.error('Failed to initialize orchestration controller:', error);
});
router.post('/doctor-creation', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdminRole, orchestrationController.createDoctor);
router.post('/bulk-import', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdminRole, orchestrationController.bulkUserImport);
router.post('/system-maintenance', auth_middleware_1.authMiddleware, orchestrationController.systemMaintenance);
router.post('/cross-service-sync', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdminRole, orchestrationController.crossServiceSync);
router.get('/operations/:operationId', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdminRole, orchestrationController.getOperationStatus);
router.put('/operations/:operationId/cancel', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdminRole, orchestrationController.cancelOperation);
router.get('/health', orchestrationController.getHealthStatus);
router.get('/statistics', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdminRole, orchestrationController.getStatistics);
exports.default = router;
//# sourceMappingURL=orchestration.routes.js.map