/**
 * Lab Result Routes - Presentation Layer
 * RESTful API endpoints for lab results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST, HIPAA
 */

import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { LabResultController } from '../controllers/LabResultController';
import { authMiddleware } from '../middleware/authMiddleware';

/**
 * Validation middleware
 */
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
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
export function createLabResultRoutes(controller: LabResultController): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware);

  /**
   * @route   POST /api/v2/clinical-emr/lab-results
   * @desc    Create new lab result
   * @access  Private (ADMIN, DOCTOR, NURSE, LAB_TECHNICIAN)
   */
  router.post(
    '/',
    [
      body('medicalRecordId')
        .notEmpty()
        .withMessage('Medical record ID is required'),
      body('patientId')
        .notEmpty()
        .withMessage('Patient ID is required'),
      body('testName')
        .notEmpty()
        .withMessage('Test name is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Test name must be between 2 and 200 characters'),
      body('testType')
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
      body('testCode')
        .optional()
        .isString()
        .withMessage('Test code must be a string'),
      body('specimenType')
        .optional()
        .isString()
        .withMessage('Specimen type must be a string'),
      body('orderedBy')
        .optional()
        .isString()
        .withMessage('Ordered by must be a string'),
      body('priority')
        .optional()
        .isIn(['routine', 'urgent', 'stat', 'asap'])
        .withMessage('Invalid priority'),
      body('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string'),
      validateRequest,
    ],
    (req, res) => controller.createLabResult(req, res)
  );

  /**
   * @route   GET /api/v2/clinical-emr/lab-results/patients/:patientId
   * @desc    Get all lab results for a patient
   * @access  Private (ADMIN, DOCTOR, NURSE, LAB_TECHNICIAN, PATIENT - own records)
   * @note    This route MUST come before /:id to avoid route conflict
   */
  router.get(
    '/patients/:patientId',
    [
      param('patientId')
        .notEmpty()
        .withMessage('Patient ID is required'),
      query('testType')
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
      query('status')
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
      query('fromDate')
        .optional()
        .isISO8601()
        .withMessage('From date must be a valid ISO 8601 date'),
      query('toDate')
        .optional()
        .isISO8601()
        .withMessage('To date must be a valid ISO 8601 date'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
      query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer'),
      validateRequest,
    ],
    (req, res) => controller.getPatientLabResults(req, res)
  );

  /**
   * @route   GET /api/v2/clinical-emr/lab-results/:id
   * @desc    Get lab result by ID
   * @access  Private (ADMIN, DOCTOR, NURSE, LAB_TECHNICIAN, PATIENT - own records)
   */
  router.get(
    '/:id',
    [
      param('id')
        .notEmpty()
        .withMessage('Result ID is required'),
      query('accessPurpose')
        .optional()
        .isString()
        .withMessage('Access purpose must be a string'),
      validateRequest,
    ],
    (req, res) => controller.getLabResult(req, res)
  );

  /**
   * @route   PUT /api/v2/clinical-emr/lab-results/:id
   * @desc    Update lab result
   * @access  Private (ADMIN, DOCTOR, LAB_TECHNICIAN)
   */
  router.put(
    '/:id',
    [
      param('id')
        .notEmpty()
        .withMessage('Result ID is required'),
      body('resultValue')
        .optional()
        .isString()
        .withMessage('Result value must be a string'),
      body('referenceRange')
        .optional()
        .isString()
        .withMessage('Reference range must be a string'),
      body('unit')
        .optional()
        .isString()
        .withMessage('Unit must be a string'),
      body('interpretation')
        .optional()
        .isString()
        .withMessage('Interpretation must be a string'),
      body('performedBy')
        .optional()
        .isString()
        .withMessage('Performed by must be a string'),
      body('verifiedBy')
        .optional()
        .isString()
        .withMessage('Verified by must be a string'),
      body('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string'),
      validateRequest,
    ],
    (req, res) => controller.updateLabResult(req, res)
  );

  return router;
}

