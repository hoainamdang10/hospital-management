"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const validation_middleware_1 = require("@hospital/shared/dist/middleware/validation.middleware");
const healthcare_controller_1 = require("../controllers/healthcare.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const healthcareController = new healthcare_controller_1.HealthcareController();
const validateDoctorId = [
    (0, express_validator_1.param)('id')
        .notEmpty()
        .withMessage('Doctor ID is required')
        .isUUID()
        .withMessage('Doctor ID must be a valid UUID')
];
const validatePatientId = [
    (0, express_validator_1.param)('patient_id')
        .notEmpty()
        .withMessage('Patient ID is required')
        .isUUID()
        .withMessage('Patient ID must be a valid UUID')
];
const validateDiagnosisId = [
    (0, express_validator_1.param)('diagnosisId')
        .notEmpty()
        .withMessage('Diagnosis ID is required')
        .isUUID()
        .withMessage('Diagnosis ID must be a valid UUID')
];
const validateICD10Code = [
    (0, express_validator_1.param)('code')
        .notEmpty()
        .withMessage('ICD-10 code is required')
        .matches(/^[A-Z]\d{2}(\.\d{1,2})?$/)
        .withMessage('ICD-10 code must be in valid format (e.g., I10, E11.9)')
];
const validateICD10Search = [
    (0, express_validator_1.query)('q')
        .notEmpty()
        .withMessage('Search term is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Search term must be 2-100 characters'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
];
const validateCreateDiagnosis = [
    (0, express_validator_1.body)('patient_id')
        .notEmpty()
        .withMessage('Patient ID is required')
        .isUUID()
        .withMessage('Patient ID must be a valid UUID'),
    (0, express_validator_1.body)('appointment_id')
        .optional()
        .isUUID()
        .withMessage('Appointment ID must be a valid UUID'),
    (0, express_validator_1.body)('icd10_code')
        .notEmpty()
        .withMessage('ICD-10 code is required')
        .matches(/^[A-Z]\d{2}(\.\d{1,2})?$/)
        .withMessage('ICD-10 code must be in valid format (e.g., I10, E11.9)'),
    (0, express_validator_1.body)('diagnosis_type')
        .optional()
        .isIn(['primary', 'secondary', 'differential'])
        .withMessage('Diagnosis type must be primary, secondary, or differential'),
    (0, express_validator_1.body)('severity')
        .optional()
        .isIn(['mild', 'moderate', 'severe', 'critical'])
        .withMessage('Severity must be mild, moderate, severe, or critical'),
    (0, express_validator_1.body)('clinical_notes')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Clinical notes cannot exceed 2000 characters'),
    (0, express_validator_1.body)('treatment_plan')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Treatment plan cannot exceed 2000 characters'),
    (0, express_validator_1.body)('follow_up_required')
        .optional()
        .isBoolean()
        .withMessage('Follow up required must be a boolean'),
    (0, express_validator_1.body)('follow_up_date')
        .optional()
        .isISO8601()
        .withMessage('Follow up date must be a valid date')
];
const validateUpdateDiagnosis = [
    (0, express_validator_1.body)('icd10_code')
        .optional()
        .matches(/^[A-Z]\d{2}(\.\d{1,2})?$/)
        .withMessage('ICD-10 code must be in valid format (e.g., I10, E11.9)'),
    (0, express_validator_1.body)('diagnosis_type')
        .optional()
        .isIn(['primary', 'secondary', 'differential'])
        .withMessage('Diagnosis type must be primary, secondary, or differential'),
    (0, express_validator_1.body)('severity')
        .optional()
        .isIn(['mild', 'moderate', 'severe', 'critical'])
        .withMessage('Severity must be mild, moderate, severe, or critical'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['active', 'resolved', 'chronic', 'recurrent'])
        .withMessage('Status must be active, resolved, chronic, or recurrent'),
    (0, express_validator_1.body)('clinical_notes')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Clinical notes cannot exceed 2000 characters'),
    (0, express_validator_1.body)('treatment_plan')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Treatment plan cannot exceed 2000 characters'),
    (0, express_validator_1.body)('follow_up_required')
        .optional()
        .isBoolean()
        .withMessage('Follow up required must be a boolean'),
    (0, express_validator_1.body)('follow_up_date')
        .optional()
        .isISO8601()
        .withMessage('Follow up date must be a valid date')
];
router.post('/:id/fhir/validate', auth_middleware_1.authMiddleware, auth_middleware_1.requireDoctor, validateDoctorId, validation_middleware_1.validateRequest, healthcareController.validateDoctorFHIR);
router.get('/:id/fhir', auth_middleware_1.authMiddleware, auth_middleware_1.requireDoctor, validateDoctorId, validation_middleware_1.validateRequest, healthcareController.getDoctorFHIR);
router.get('/icd10/search', auth_middleware_1.authMiddleware, auth_middleware_1.requireDoctor, validateICD10Search, validation_middleware_1.validateRequest, healthcareController.searchICD10Codes);
router.get('/icd10/validate/:code', auth_middleware_1.authMiddleware, auth_middleware_1.requireDoctor, validateICD10Code, validation_middleware_1.validateRequest, healthcareController.validateICD10Code);
router.get('/icd10/category/:category', auth_middleware_1.authMiddleware, auth_middleware_1.requireDoctor, (0, express_validator_1.param)('category')
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be 2-50 characters'), validation_middleware_1.validateRequest, healthcareController.getICD10CodesByCategory);
router.post('/:doctorId/diagnoses', auth_middleware_1.authMiddleware, auth_middleware_1.requireDoctor, (0, express_validator_1.param)('doctor_id')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isUUID()
    .withMessage('Doctor ID must be a valid UUID'), validateCreateDiagnosis, validation_middleware_1.validateRequest, healthcareController.createDiagnosis);
router.get('/diagnoses/patient/:patientId', auth_middleware_1.authMiddleware, auth_middleware_1.requireDoctor, validatePatientId, validation_middleware_1.validateRequest, healthcareController.getPatientDiagnoses);
router.put('/diagnoses/:diagnosisId', auth_middleware_1.authMiddleware, auth_middleware_1.requireDoctor, validateDiagnosisId, validateUpdateDiagnosis, validation_middleware_1.validateRequest, healthcareController.updateDiagnosis);
router.get('/:id/healthcare/compliance', auth_middleware_1.authMiddleware, auth_middleware_1.requireDoctor, validateDoctorId, validation_middleware_1.validateRequest, healthcareController.getHealthcareCompliance);
router.get('/:id/healthcare/stats', auth_middleware_1.authMiddleware, auth_middleware_1.requireDoctor, validateDoctorId, validation_middleware_1.validateRequest, (req, res) => {
    res.json({
        success: true,
        message: 'Healthcare statistics endpoint - Coming in Phase 2',
        data: {
            feature_status: 'PLANNED',
            implementation_phase: 'Phase 2: Frontend Integration'
        }
    });
});
exports.default = router;
//# sourceMappingURL=healthcare.routes.js.map