"use strict";
/**
 * Lab Result Routes - Presentation Layer
 * RESTful API endpoints for lab results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLabResultRoutes = createLabResultRoutes;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authMiddleware_1 = require("../middleware/authMiddleware");
/**
 * Validation middleware
 */
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    next();
};
/**
 * Create lab result routes
 */
function createLabResultRoutes(controller) {
    const router = (0, express_1.Router)();
    // Apply authentication to all routes
    router.use(authMiddleware_1.authMiddleware);
    /**
     * @route   POST /api/v2/clinical-emr/lab-results
     * @desc    Create new lab result
     * @access  Private (ADMIN, DOCTOR, NURSE, LAB_TECHNICIAN)
     */
    router.post('/', [
        (0, express_validator_1.body)('medicalRecordId')
            .notEmpty()
            .withMessage('Medical record ID is required'),
        (0, express_validator_1.body)('patientId')
            .notEmpty()
            .withMessage('Patient ID is required'),
        (0, express_validator_1.body)('testName')
            .notEmpty()
            .withMessage('Test name is required')
            .isLength({ min: 2, max: 200 })
            .withMessage('Test name must be between 2 and 200 characters'),
        (0, express_validator_1.body)('testType')
            .notEmpty()
            .withMessage('Test type is required')
            .isIn([
            'hematology',
            'biochemistry',
            'microbiology',
            'immunology',
            'serology',
            'urinalysis',
            'coagulation',
            'endocrinology',
            'toxicology',
            'molecular',
            'genetics',
            'other',
        ])
            .withMessage('Invalid test type'),
        (0, express_validator_1.body)('testCode')
            .optional()
            .isString()
            .withMessage('Test code must be a string'),
        (0, express_validator_1.body)('specimenType')
            .optional()
            .isString()
            .withMessage('Specimen type must be a string'),
        (0, express_validator_1.body)('orderedBy')
            .optional()
            .isString()
            .withMessage('Ordered by must be a string'),
        (0, express_validator_1.body)('priority')
            .optional()
            .isIn(['routine', 'urgent', 'stat', 'asap'])
            .withMessage('Invalid priority'),
        (0, express_validator_1.body)('notes')
            .optional()
            .isString()
            .withMessage('Notes must be a string'),
        validateRequest,
    ], (req, res) => controller.createLabResult(req, res));
    /**
     * @route   GET /api/v2/clinical-emr/lab-results/patients/:patientId
     * @desc    Get all lab results for a patient
     * @access  Private (ADMIN, DOCTOR, NURSE, LAB_TECHNICIAN, PATIENT - own records)
     * @note    This route MUST come before /:id to avoid route conflict
     */
    router.get('/patients/:patientId', [
        (0, express_validator_1.param)('patientId')
            .notEmpty()
            .withMessage('Patient ID is required'),
        (0, express_validator_1.query)('testType')
            .optional()
            .isIn([
            'hematology',
            'biochemistry',
            'microbiology',
            'immunology',
            'serology',
            'urinalysis',
            'coagulation',
            'endocrinology',
            'toxicology',
            'molecular',
            'genetics',
            'other',
        ])
            .withMessage('Invalid test type'),
        (0, express_validator_1.query)('status')
            .optional()
            .isIn([
            'ordered',
            'specimen_collected',
            'in_progress',
            'preliminary',
            'final',
            'verified',
            'amended',
            'cancelled',
        ])
            .withMessage('Invalid status'),
        (0, express_validator_1.query)('fromDate')
            .optional()
            .isISO8601()
            .withMessage('From date must be a valid ISO 8601 date'),
        (0, express_validator_1.query)('toDate')
            .optional()
            .isISO8601()
            .withMessage('To date must be a valid ISO 8601 date'),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        (0, express_validator_1.query)('offset')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Offset must be a non-negative integer'),
        validateRequest,
    ], (req, res) => controller.getPatientLabResults(req, res));
    /**
     * @route   GET /api/v2/clinical-emr/lab-results/:id
     * @desc    Get lab result by ID
     * @access  Private (ADMIN, DOCTOR, NURSE, LAB_TECHNICIAN, PATIENT - own records)
     */
    router.get('/:id', [
        (0, express_validator_1.param)('id')
            .notEmpty()
            .withMessage('Result ID is required'),
        (0, express_validator_1.query)('accessPurpose')
            .optional()
            .isString()
            .withMessage('Access purpose must be a string'),
        validateRequest,
    ], (req, res) => controller.getLabResult(req, res));
    /**
     * @route   PUT /api/v2/clinical-emr/lab-results/:id
     * @desc    Update lab result
     * @access  Private (ADMIN, DOCTOR, LAB_TECHNICIAN)
     */
    router.put('/:id', [
        (0, express_validator_1.param)('id')
            .notEmpty()
            .withMessage('Result ID is required'),
        (0, express_validator_1.body)('resultValue')
            .optional()
            .isString()
            .withMessage('Result value must be a string'),
        (0, express_validator_1.body)('referenceRange')
            .optional()
            .isString()
            .withMessage('Reference range must be a string'),
        (0, express_validator_1.body)('unit')
            .optional()
            .isString()
            .withMessage('Unit must be a string'),
        (0, express_validator_1.body)('interpretation')
            .optional()
            .isString()
            .withMessage('Interpretation must be a string'),
        (0, express_validator_1.body)('performedBy')
            .optional()
            .isString()
            .withMessage('Performed by must be a string'),
        (0, express_validator_1.body)('verifiedBy')
            .optional()
            .isString()
            .withMessage('Verified by must be a string'),
        (0, express_validator_1.body)('notes')
            .optional()
            .isString()
            .withMessage('Notes must be a string'),
        validateRequest,
    ], (req, res) => controller.updateLabResult(req, res));
    return router;
}
//# sourceMappingURL=labResultRoutes.js.map