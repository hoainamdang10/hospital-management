"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const slot_management_controller_1 = require("../controllers/slot-management.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const slotController = new slot_management_controller_1.SlotManagementController();
const validateDoctorId = (0, express_validator_1.param)('doctor_id')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .matches(/^[A-Z]{4}-DOC-\d{6}-\d{3}$/)
    .withMessage('Invalid doctor ID format');
const validateDateQuery = (0, express_validator_1.query)('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be in YYYY-MM-DD format');
const validateGenerateSlots = [
    (0, express_validator_1.body)('startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Start date must be in YYYY-MM-DD format'),
    (0, express_validator_1.body)('endDate')
        .notEmpty()
        .withMessage('End date is required')
        .isISO8601()
        .withMessage('End date must be in YYYY-MM-DD format')
];
const validateBulkGenerate = [
    (0, express_validator_1.body)('daysAhead')
        .optional()
        .isInt({ min: 1, max: 90 })
        .withMessage('Days ahead must be between 1 and 90'),
    (0, express_validator_1.body)('departmentId')
        .optional()
        .isString()
        .withMessage('Department ID must be a string')
];
router.post('/:doctorId/slots/generate', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin', 'doctor']), validateDoctorId, validateGenerateSlots, slotController.generateDoctorSlots.bind(slotController));
router.get('/:doctorId/slots/available', validateDoctorId, validateDateQuery, slotController.getAvailableSlots.bind(slotController));
router.get('/:doctorId/availability/weekly', validateDoctorId, (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('Start date must be in YYYY-MM-DD format'), slotController.getWeeklyAvailability.bind(slotController));
router.get('/:doctorId/availability/check', validateDoctorId, validateDateQuery, (0, express_validator_1.query)('time')
    .notEmpty()
    .withMessage('Time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'), (0, express_validator_1.query)('duration')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes'), slotController.checkAvailability.bind(slotController));
router.post('/slots/bulk-generate', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin']), validateBulkGenerate, slotController.bulkGenerateSlots.bind(slotController));
exports.default = router;
//# sourceMappingURL=slot-management.routes.js.map