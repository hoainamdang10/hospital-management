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
const validateExperienceId = [
    (0, express_validator_1.param)('experienceId').notEmpty().withMessage('Experience ID is required')
];
const validateDoctorId = [
    (0, express_validator_1.param)('doctor_id').notEmpty().withMessage('Doctor ID is required')
];
const validateCreateExperience = [
    (0, express_validator_1.body)('doctor_id').notEmpty().withMessage('Doctor ID is required'),
    (0, express_validator_1.body)('institution_name').isLength({ min: 2, max: 255 }).withMessage('Institution name must be 2-255 characters'),
    (0, express_validator_1.body)('position').isLength({ min: 2, max: 255 }).withMessage('Position must be 2-255 characters'),
    (0, express_validator_1.body)('start_date').isISO8601().withMessage('Valid start date is required'),
    (0, express_validator_1.body)('end_date').optional().isISO8601().withMessage('Valid end date is required'),
    (0, express_validator_1.body)('is_current').optional().isBoolean(),
    (0, express_validator_1.body)('description').optional().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    (0, express_validator_1.body)('experience_type').isIn(['work', 'education', 'certification', 'research']).withMessage('Valid experience type is required')
];
const validateUpdateExperience = [
    (0, express_validator_1.body)('institution_name').optional().isLength({ min: 2, max: 255 }),
    (0, express_validator_1.body)('position').optional().isLength({ min: 2, max: 255 }),
    (0, express_validator_1.body)('start_date').optional().isISO8601(),
    (0, express_validator_1.body)('end_date').optional().isISO8601(),
    (0, express_validator_1.body)('is_current').optional().isBoolean(),
    (0, express_validator_1.body)('description').optional().isLength({ max: 1000 }),
    (0, express_validator_1.body)('experience_type').optional().isIn(['work', 'education', 'certification', 'research'])
];
router.get('/doctor/:doctorId', validateDoctorId, doctorController.getDoctorExperiences.bind(doctorController));
router.get('/:doctorId/experience', validateDoctorId, doctorController.getDoctorExperiences.bind(doctorController));
router.get('/doctor/:doctorId/timeline', validateDoctorId, doctorController.getExperienceTimeline.bind(doctorController));
router.get('/doctor/:doctorId/total', validateDoctorId, doctorController.getTotalExperience.bind(doctorController));
router.post('/', validateCreateExperience, doctorController.createExperience.bind(doctorController));
router.put('/:experienceId', validateExperienceId, validateUpdateExperience, doctorController.updateExperience.bind(doctorController));
router.delete('/:experienceId', validateExperienceId, doctorController.deleteExperience.bind(doctorController));
exports.default = router;
//# sourceMappingURL=experience.routes.js.map