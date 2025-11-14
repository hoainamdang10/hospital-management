/**
 * Rescheduling Queue Routes - Presentation Layer
 * Express routes for rescheduling queue management
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API Design
 */

import { Router } from 'express';
import { ReschedulingQueueController } from '../controllers/ReschedulingQueueController';
import { authenticate } from '../middleware/AuthMiddleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

// Create router
const router = Router();

/**
 * Validation schemas
 */
const updatePatientResponseSchema = [
  param('id').isUUID().withMessage('Invalid queue entry ID'),
  body('patientResponse')
    .isIn(['ACCEPTED', 'REJECTED', 'PENDING', 'NO_RESPONSE'])
    .withMessage('Invalid patient response'),
  body('respondedBy').optional().isString().withMessage('Responded by must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

const completeReschedulingSchema = [
  param('id').isUUID().withMessage('Invalid queue entry ID'),
  body('newAppointmentId').isString().notEmpty().withMessage('New appointment ID is required'),
  body('resolvedBy').isString().notEmpty().withMessage('Resolved by is required')
];

const getPendingEntriesSchema = [
  query('doctorId').optional().isString().withMessage('Doctor ID must be a string'),
  query('priority')
    .optional()
    .isIn(['EMERGENCY', 'URGENT', 'NORMAL', 'LOW'])
    .withMessage('Invalid priority'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];

const getEntriesByDoctorSchema = [
  param('doctorId').isString().notEmpty().withMessage('Doctor ID is required'),
  query('status')
    .optional()
    .isIn([
      'PENDING_RESCHEDULE', 'SEARCHING_ALTERNATIVES', 'NOTIFIED',
      'ACCEPTED', 'REJECTED', 'COMPLETED', 'EXPIRED'
    ])
    .withMessage('Invalid status'),
  query('priority')
    .optional()
    .isIn(['EMERGENCY', 'URGENT', 'NORMAL', 'LOW'])
    .withMessage('Invalid priority'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];

/**
 * Initialize routes with controller
 */
export function initializeReschedulingQueueRoutes(controller: ReschedulingQueueController): Router {
  /**
   * GET /api/v1/rescheduling-queue/statistics
   * Get rescheduling queue statistics
   */
  router.get('/statistics', 
    authenticate,
    controller.getStatistics.bind(controller)
  );

  /**
   * GET /api/v1/rescheduling-queue/pending
   * Get pending rescheduling entries
   */
  router.get('/pending',
    authenticate,
    validateRequest(getPendingEntriesSchema),
    controller.getPendingEntries.bind(controller)
  );

  /**
   * GET /api/v1/rescheduling-queue/:id
   * Get rescheduling entry by ID
   */
  router.get('/:id',
    authenticate,
    param('id').isUUID().withMessage('Invalid queue entry ID'),
    validateRequest,
    controller.getEntryById.bind(controller)
  );

  /**
   * PATCH /api/v1/rescheduling-queue/:id/patient-response
   * Update patient response for rescheduling
   */
  router.patch('/:id/patient-response',
    authenticate,
    validateRequest(updatePatientResponseSchema),
    controller.updatePatientResponse.bind(controller)
  );

  /**
   * POST /api/v1/rescheduling-queue/process-expired
   * Process expired rescheduling entries
   */
  router.post('/process-expired',
    authenticate,
    controller.processExpiredEntries.bind(controller)
  );

  /**
   * GET /api/v1/rescheduling-queue/doctor/:doctorId
   * Get rescheduling entries by doctor ID
   */
  router.get('/doctor/:doctorId',
    authenticate,
    validateRequest(getEntriesByDoctorSchema),
    controller.getEntriesByDoctor.bind(controller)
  );

  /**
   * POST /api/v1/rescheduling-queue/:id/complete
   * Complete rescheduling with new appointment
   */
  router.post('/:id/complete',
    authenticate,
    validateRequest(completeReschedulingSchema),
    controller.completeRescheduling.bind(controller)
  );

  /**
   * GET /api/v1/rescheduling-queue/:id/available-slots
   * Find available slots for rescheduling
   */
  router.get('/:id/available-slots',
    authenticate,
    param('id').isUUID().withMessage('Invalid queue entry ID'),
    validateRequest,
    controller.findAvailableSlots.bind(controller)
  );

  return router;
}

/**
 * Health check endpoint for rescheduling queue service
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rescheduling-queue',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

export default router;
