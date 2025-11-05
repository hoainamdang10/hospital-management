/**
 * Medical Imaging Routes - Presentation Layer
 * RESTful API endpoints for medical imaging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST, HIPAA
 */

import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { MedicalImagingController } from '../controllers/MedicalImagingController';
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
 * Create medical imaging routes
 */
export function createMedicalImagingRoutes(controller: MedicalImagingController): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware);

  /**
   * @route   POST /api/v2/clinical-emr/medical-imaging
   * @desc    Create new medical imaging study
   * @access  Private (ADMIN, DOCTOR, RADIOLOGIST)
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
      body('imagingType')
        .notEmpty()
        .withMessage('Imaging type is required')
        .isIn([
          'x_ray', 'ct_scan', 'mri', 'ultrasound', 'pet_scan',
          'mammography', 'fluoroscopy', 'nuclear_medicine', 'other'
        ])
        .withMessage('Invalid imaging type'),
      body('modality')
        .notEmpty()
        .withMessage('Modality is required')
        .isIn(['CR', 'DX', 'CT', 'MR', 'US', 'PT', 'MG', 'XA', 'NM', 'OTHER'])
        .withMessage('Invalid modality'),
      body('bodyPart')
        .notEmpty()
        .withMessage('Body part is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Body part must be between 2 and 100 characters'),
      body('laterality')
        .optional()
        .isString()
        .withMessage('Laterality must be a string'),
      body('studyDescription')
        .optional()
        .isString()
        .withMessage('Study description must be a string'),
      body('clinicalIndication')
        .optional()
        .isString()
        .withMessage('Clinical indication must be a string'),
      body('orderedBy')
        .optional()
        .isString()
        .withMessage('Ordered by must be a string'),
      body('priority')
        .optional()
        .isIn(['routine', 'urgent', 'stat', 'asap'])
        .withMessage('Invalid priority'),
      body('technique')
        .optional()
        .isString()
        .withMessage('Technique must be a string'),
      body('contrastUsed')
        .optional()
        .isBoolean()
        .withMessage('Contrast used must be a boolean'),
      body('contrastType')
        .optional()
        .isString()
        .withMessage('Contrast type must be a string'),
      body('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string'),
      validateRequest,
    ],
    (req, res) => controller.createMedicalImaging(req, res)
  );

  /**
   * @route   GET /api/v2/clinical-emr/medical-imaging/patients/:patientId
   * @desc    Get all medical imaging for a patient
   * @access  Private (ADMIN, DOCTOR, NURSE, RADIOLOGIST, PATIENT - own records)
   * @note    This route MUST come before /:id to avoid route conflict
   */
  router.get(
    '/patients/:patientId',
    [
      param('patientId')
        .notEmpty()
        .withMessage('Patient ID is required'),
      query('imagingType')
        .optional()
        .isIn([
          'x_ray', 'ct_scan', 'mri', 'ultrasound', 'pet_scan',
          'mammography', 'fluoroscopy', 'nuclear_medicine', 'other'
        ])
        .withMessage('Invalid imaging type'),
      query('modality')
        .optional()
        .isIn(['CR', 'DX', 'CT', 'MR', 'US', 'PT', 'MG', 'XA', 'NM', 'OTHER'])
        .withMessage('Invalid modality'),
      query('status')
        .optional()
        .isIn([
          'ordered', 'scheduled', 'in_progress', 'completed',
          'reported', 'verified', 'cancelled'
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
    (req, res) => controller.getPatientMedicalImaging(req, res)
  );

  /**
   * @route   GET /api/v2/clinical-emr/medical-imaging/:id
   * @desc    Get medical imaging by ID
   * @access  Private (ADMIN, DOCTOR, NURSE, RADIOLOGIST, PATIENT - own records)
   */
  router.get(
    '/:id',
    [
      param('id')
        .notEmpty()
        .withMessage('Imaging ID is required'),
      query('accessPurpose')
        .optional()
        .isString()
        .withMessage('Access purpose must be a string'),
      validateRequest,
    ],
    (req, res) => controller.getMedicalImaging(req, res)
  );

  /**
   * @route   PUT /api/v2/clinical-emr/medical-imaging/:id
   * @desc    Update medical imaging
   * @access  Private (ADMIN, DOCTOR, RADIOLOGIST)
   */
  router.put(
    '/:id',
    [
      param('id')
        .notEmpty()
        .withMessage('Imaging ID is required'),
      body('findings')
        .optional()
        .isString()
        .withMessage('Findings must be a string'),
      body('impression')
        .optional()
        .isString()
        .withMessage('Impression must be a string'),
      body('radiologistId')
        .optional()
        .isString()
        .withMessage('Radiologist ID must be a string'),
      body('technique')
        .optional()
        .isString()
        .withMessage('Technique must be a string'),
      body('imageUrls')
        .optional()
        .isArray()
        .withMessage('Image URLs must be an array'),
      body('dicomStudyUid')
        .optional()
        .isString()
        .withMessage('DICOM Study UID must be a string'),
      body('seriesCount')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Series count must be a non-negative integer'),
      body('instanceCount')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Instance count must be a non-negative integer'),
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
    (req, res) => controller.updateMedicalImaging(req, res)
  );

  return router;
}
