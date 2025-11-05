/**
 * Clinical Note Routes - RESTful API Endpoints
 * Presentation Layer - Routes for clinical documentation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA
 */

import { Router } from 'express';
import { container } from '../../infrastructure/di/container';
import { TYPES } from '../../infrastructure/di/types';
import { ClinicalNoteController } from '../controllers/ClinicalNoteController';
import { AuthenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import { errorHandlingMiddleware } from '../middleware/errorHandler';

/**
 * Create clinical note routes with authentication and authorization
 */
export function createClinicalNoteRoutes(controller: ClinicalNoteController): Router {
  const router = Router();
  
  // Get authentication middleware from DI container
  const authMiddleware = container.get<AuthenticationMiddleware>(TYPES.AuthenticationMiddleware);

  // =====================================================
  // CLINICAL NOTE CRUD ROUTES
  // =====================================================

  /**
   * Create new clinical note
   * POST /api/v2/clinical-emr/notes
   * @access Doctor, Nurse, Admin
   * @audit PHI Access - Create Clinical Note
   */
  router.post(
    '/',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(), // Doctor, Nurse, Admin can create notes
    (req, res, next) => controller.createNote(req, res, next)
  );

  /**
   * Get clinical note by ID
   * GET /api/v2/clinical-emr/notes/:noteId
   * @access Healthcare Staff (view clinical documentation)
   * @audit PHI Access - View Clinical Note
   */
  router.get(
    '/:noteId',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(),
    (req, res, next) => controller.getNote(req, res, next)
  );

  /**
   * Update clinical note
   * PUT /api/v2/clinical-emr/notes/:noteId
   * @access Doctor, Nurse (original author), Admin
   * @audit PHI Access - Update Clinical Note
   */
  router.put(
    '/:noteId',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(),
    (req, res, next) => controller.updateNote(req, res, next)
  );

  /**
   * Cosign clinical note (supervisor approval)
   * POST /api/v2/clinical-emr/notes/:noteId/cosign
   * @access Doctor (supervisor), Admin
   * @audit PHI Access - Cosign Clinical Note (Critical)
   */
  router.post(
    '/:noteId/cosign',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(), // Only doctors and admins can cosign
    (req, res, next) => controller.cosignNote(req, res, next)
  );

  /**
   * List clinical notes with filtering
   * GET /api/v2/clinical-emr/notes
   * @access Healthcare Staff
   * @audit PHI Access - List Clinical Notes
   * @query patientId, authorId, type, startDate, endDate
   */
  router.get(
    '/',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(),
    (req, res, next) => controller.listNotes(req, res, next)
  );

  // =====================================================
  // ERROR HANDLING MIDDLEWARE
  // =====================================================
  
  router.use(errorHandlingMiddleware);

  return router;
}
