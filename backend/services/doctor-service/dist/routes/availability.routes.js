"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const availability_controller_1 = require("../controllers/availability.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = express_1.default.Router();
const availabilityController = new availability_controller_1.AvailabilityController();
router.get("/:doctorId/availability/:date", auth_middleware_1.authenticateToken, validation_middleware_1.validateDoctorId, availabilityController.getDoctorAvailability);
router.get("/:doctorId/available-slots/:date", auth_middleware_1.authenticateToken, validation_middleware_1.validateDoctorId, availabilityController.getAvailableTimeSlots);
router.post("/:doctorId/check-availability", auth_middleware_1.authenticateToken, validation_middleware_1.validateDoctorId, availabilityController.checkTimeSlotAvailability);
router.get("/:doctorId/availability/week/:startDate", auth_middleware_1.authenticateToken, validation_middleware_1.validateDoctorId, availabilityController.getWeeklyAvailability);
exports.default = router;
//# sourceMappingURL=availability.routes.js.map