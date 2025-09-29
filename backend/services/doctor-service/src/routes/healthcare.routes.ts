// ============================================================================
// HEALTHCARE ROUTES - FHIR & ICD-10 Integration for Doctor Service
// Healthcare standards API routes
// ============================================================================

import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '@hospital/shared/dist/middleware/validation.middleware';
import { HealthcareController } from '../controllers/healthcare.controller';
import { authMiddleware, requireDoctor } from '../middleware/auth.middleware';

const router = express.Router();
const healthcareController = new HealthcareController();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const validateDoctorId = [
  param('id')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isUUID()
    .withMessage('Doctor ID must be a valid UUID')
];

const validatePatientId = [
  param('patient_id')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isUUID()
    .withMessage('Patient ID must be a valid UUID')
];

const validateDiagnosisId = [
  param('diagnosisId')
    .notEmpty()
    .withMessage('Diagnosis ID is required')
    .isUUID()
    .withMessage('Diagnosis ID must be a valid UUID')
];

const validateICD10Code = [
  param('code')
    .notEmpty()
    .withMessage('ICD-10 code is required')
    .matches(/^[A-Z]\d{2}(\.\d{1,2})?$/)
    .withMessage('ICD-10 code must be in valid format (e.g., I10, E11.9)')
];

const validateICD10Search = [
  query('q')
    .notEmpty()
    .withMessage('Search term is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be 2-100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const validateCreateDiagnosis = [
  body('patient_id')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isUUID()
    .withMessage('Patient ID must be a valid UUID'),
  body('appointment_id')
    .optional()
    .isUUID()
    .withMessage('Appointment ID must be a valid UUID'),
  body('icd10_code')
    .notEmpty()
    .withMessage('ICD-10 code is required')
    .matches(/^[A-Z]\d{2}(\.\d{1,2})?$/)
    .withMessage('ICD-10 code must be in valid format (e.g., I10, E11.9)'),
  body('diagnosis_type')
    .optional()
    .isIn(['primary', 'secondary', 'differential'])
    .withMessage('Diagnosis type must be primary, secondary, or differential'),
  body('severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe', 'critical'])
    .withMessage('Severity must be mild, moderate, severe, or critical'),
  body('clinical_notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Clinical notes cannot exceed 2000 characters'),
  body('treatment_plan')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Treatment plan cannot exceed 2000 characters'),
  body('follow_up_required')
    .optional()
    .isBoolean()
    .withMessage('Follow up required must be a boolean'),
  body('follow_up_date')
    .optional()
    .isISO8601()
    .withMessage('Follow up date must be a valid date')
];

const validateUpdateDiagnosis = [
  body('icd10_code')
    .optional()
    .matches(/^[A-Z]\d{2}(\.\d{1,2})?$/)
    .withMessage('ICD-10 code must be in valid format (e.g., I10, E11.9)'),
  body('diagnosis_type')
    .optional()
    .isIn(['primary', 'secondary', 'differential'])
    .withMessage('Diagnosis type must be primary, secondary, or differential'),
  body('severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe', 'critical'])
    .withMessage('Severity must be mild, moderate, severe, or critical'),
  body('status')
    .optional()
    .isIn(['active', 'resolved', 'chronic', 'recurrent'])
    .withMessage('Status must be active, resolved, chronic, or recurrent'),
  body('clinical_notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Clinical notes cannot exceed 2000 characters'),
  body('treatment_plan')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Treatment plan cannot exceed 2000 characters'),
  body('follow_up_required')
    .optional()
    .isBoolean()
    .withMessage('Follow up required must be a boolean'),
  body('follow_up_date')
    .optional()
    .isISO8601()
    .withMessage('Follow up date must be a valid date')
];

// ============================================================================
// FHIR VALIDATION ROUTES
// ============================================================================

/**
 * @route   POST /api/doctors/:id/fhir/validate
 * @desc    Validate doctor data against FHIR Practitioner resource
 * @access  Private (Doctor only)
 */
router.post(
  '/:id/fhir/validate',
  authMiddleware,
  requireDoctor,
  validateDoctorId,
  validateRequest,
  healthcareController.validateDoctorFHIR
);

/**
 * @route   GET /api/doctors/:id/fhir
 * @desc    Get doctor as FHIR Practitioner resource
 * @access  Private (Doctor only)
 */
router.get(
  '/:id/fhir',
  authMiddleware,
  requireDoctor,
  validateDoctorId,
  validateRequest,
  healthcareController.getDoctorFHIR
);

// ============================================================================
// ICD-10 DIAGNOSIS ROUTES
// ============================================================================

/**
 * @route   GET /api/doctors/icd10/search
 * @desc    Search ICD-10 diagnosis codes
 * @access  Private (Doctor only)
 */
router.get(
  '/icd10/search',
  authMiddleware,
  requireDoctor,
  validateICD10Search,
  validateRequest,
  healthcareController.searchICD10Codes
);

/**
 * @route   GET /api/doctors/icd10/validate/:code
 * @desc    Validate ICD-10 diagnosis code
 * @access  Private (Doctor only)
 */
router.get(
  '/icd10/validate/:code',
  authMiddleware,
  requireDoctor,
  validateICD10Code,
  validateRequest,
  healthcareController.validateICD10Code
);

/**
 * @route   GET /api/doctors/icd10/category/:category
 * @desc    Get ICD-10 codes by category
 * @access  Private (Doctor only)
 */
router.get(
  '/icd10/category/:category',
  authMiddleware,
  requireDoctor,
  param('category')
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be 2-50 characters'),
  validateRequest,
  healthcareController.getICD10CodesByCategory
);

// ============================================================================
// DIAGNOSIS MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   POST /api/doctors/:doctorId/diagnoses
 * @desc    Create patient diagnosis
 * @access  Private (Doctor only)
 */
router.post(
  '/:doctorId/diagnoses',
  authMiddleware,
  requireDoctor,
  param('doctor_id')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isUUID()
    .withMessage('Doctor ID must be a valid UUID'),
  validateCreateDiagnosis,
  validateRequest,
  healthcareController.createDiagnosis
);

/**
 * @route   GET /api/doctors/diagnoses/patient/:patient_id
 * @desc    Get patient diagnoses
 * @access  Private (Doctor only)
 */
router.get(
  '/diagnoses/patient/:patientId',
  authMiddleware,
  requireDoctor,
  validatePatientId,
  validateRequest,
  healthcareController.getPatientDiagnoses
);

/**
 * @route   PUT /api/doctors/diagnoses/:diagnosisId
 * @desc    Update diagnosis
 * @access  Private (Doctor only)
 */
router.put(
  '/diagnoses/:diagnosisId',
  authMiddleware,
  requireDoctor,
  validateDiagnosisId,
  validateUpdateDiagnosis,
  validateRequest,
  healthcareController.updateDiagnosis
);

// ============================================================================
// HEALTHCARE COMPLIANCE ROUTES
// ============================================================================

/**
 * @route   GET /api/doctors/:id/healthcare/compliance
 * @desc    Get healthcare compliance status for doctor
 * @access  Private (Doctor only)
 */
router.get(
  '/:id/healthcare/compliance',
  authMiddleware,
  requireDoctor,
  validateDoctorId,
  validateRequest,
  healthcareController.getHealthcareCompliance
);

// ============================================================================
// HEALTHCARE STATISTICS ROUTES (Future Enhancement)
// ============================================================================

/**
 * @route   GET /api/doctors/:id/healthcare/stats
 * @desc    Get healthcare statistics for doctor (diagnoses, FHIR compliance, etc.)
 * @access  Private (Doctor only)
 * @note    This will be implemented in Phase 2
 */
router.get(
  '/:id/healthcare/stats',
  authMiddleware,
  requireDoctor,
  validateDoctorId,
  validateRequest,
  (req, res) => {
    res.json({
      success: true,
      message: 'Healthcare statistics endpoint - Coming in Phase 2',
      data: {
        feature_status: 'PLANNED',
        implementation_phase: 'Phase 2: Frontend Integration'
      }
    });
  }
);

export default router;
