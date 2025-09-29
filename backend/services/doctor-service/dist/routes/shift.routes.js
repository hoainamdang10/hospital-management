"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const doctor_controller_1 = require("../controllers/doctor.controller");
const router = express_1.default.Router();
const doctorController = new doctor_controller_1.DoctorController();
const validateShiftId = [
    (0, express_validator_1.param)('shiftId').notEmpty().withMessage('Shift ID is required')
];
const validateDoctorId = [
    (0, express_validator_1.param)('doctor_id').notEmpty().withMessage('Doctor ID is required')
];
const validateCreateShift = [
    (0, express_validator_1.body)('doctor_id').notEmpty().withMessage('Doctor ID is required'),
    (0, express_validator_1.body)('shift_type').isIn(['morning', 'afternoon', 'night', 'emergency']).withMessage('Valid shift type is required'),
    (0, express_validator_1.body)('shift_date').isISO8601().withMessage('Valid shift date is required'),
    (0, express_validator_1.body)('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
    (0, express_validator_1.body)('end_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)'),
    (0, express_validator_1.body)('department_id').notEmpty().withMessage('Department ID is required'),
    (0, express_validator_1.body)('is_emergency_shift').optional().isBoolean(),
    (0, express_validator_1.body)('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];
const validateUpdateShift = [
    (0, express_validator_1.body)('shift_type').optional().isIn(['morning', 'afternoon', 'night', 'emergency']),
    (0, express_validator_1.body)('shift_date').optional().isISO8601(),
    (0, express_validator_1.body)('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    (0, express_validator_1.body)('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    (0, express_validator_1.body)('department_id').optional().notEmpty(),
    (0, express_validator_1.body)('status').optional().isIn(['scheduled', 'confirmed', 'completed', 'cancelled']),
    (0, express_validator_1.body)('is_emergency_shift').optional().isBoolean(),
    (0, express_validator_1.body)('notes').optional().isLength({ max: 500 })
];
router.get('/doctor/:doctorId', validateDoctorId, doctorController.getDoctorShifts.bind(doctorController));
router.get('/doctor/:doctorId/upcoming', validateDoctorId, doctorController.getUpcomingShifts.bind(doctorController));
router.get('/doctor/:doctorId/statistics', validateDoctorId, doctorController.getShiftStatistics.bind(doctorController));
router.post('/', validateCreateShift, doctorController.createShift.bind(doctorController));
router.put('/:shiftId', validateShiftId, validateUpdateShift, doctorController.updateShift.bind(doctorController));
router.patch('/:shiftId/confirm', validateShiftId, doctorController.confirmShift.bind(doctorController));
exports.default = router;
//# sourceMappingURL=shift.routes.js.map