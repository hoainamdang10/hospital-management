"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkin_controller_1 = require("../modules/receptionist/controllers/checkin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const checkInController = new checkin_controller_1.CheckInController();
router.post('/', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, checkInController.createCheckIn);
router.get('/queue', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, checkInController.getQueue);
router.put('/:checkInId/status', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, checkInController.updateCheckInStatus);
router.post('/call-next', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, checkInController.callNextPatient);
router.get('/patient/:patientId/history', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, checkInController.getPatientCheckInHistory);
router.get('/stats', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, checkInController.getCheckInStats);
exports.default = router;
//# sourceMappingURL=checkin.routes.js.map