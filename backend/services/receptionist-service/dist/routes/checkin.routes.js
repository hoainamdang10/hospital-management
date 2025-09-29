"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkin_controller_1 = require("../controllers/checkin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const checkInController = new checkin_controller_1.CheckInController();
router.post('/', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, checkInController.createCheckIn);
router.get('/queue', auth_middleware_1.authMiddleware, checkInController.getQueue);
router.put('/appointments/:appointmentId/status', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, checkInController.updateAppointmentStatus);
router.post('/call-next', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, checkInController.callNextPatient);
exports.default = router;
//# sourceMappingURL=checkin.routes.js.map