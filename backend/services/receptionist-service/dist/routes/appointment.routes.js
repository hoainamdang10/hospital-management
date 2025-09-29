"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appointment_controller_1 = require("../controllers/appointment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const appointmentController = new appointment_controller_1.AppointmentController();
router.get('/today', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, appointmentController.getTodayAppointments);
router.put('/:appointmentId/notes', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, appointmentController.updateAppointmentNotes);
router.put('/:appointmentId/reschedule', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, appointmentController.rescheduleAppointment);
router.put('/:appointmentId/cancel', auth_middleware_1.authMiddleware, auth_middleware_1.requireReceptionistOrAdmin, appointmentController.cancelAppointment);
exports.default = router;
//# sourceMappingURL=appointment.routes.js.map