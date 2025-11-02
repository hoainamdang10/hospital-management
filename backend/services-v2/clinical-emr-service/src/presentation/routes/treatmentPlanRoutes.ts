/**
 * Treatment Plan Routes - RESTful API Endpoints
 * Presentation Layer - Routes for patient treatment plans
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA
 */

import { Router } from 'express';
import { container } from '../../infrastructure/di/container';
import { TYPES } from '../../infrastructure/di/types';
import { TreatmentPlanController } from '../controllers/TreatmentPlanController';
import { AuthenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import { errorHandlingMiddleware } from '../middleware/errorHandler';

/**
 * Create treatment plan routes with authentication and authorization
 */
export function createTreatmentPlanRoutes(controller: TreatmentPlanController): Router {
  const router = Router();
  
  // Get authentication middleware from DI container
  const authMiddleware = container.get<AuthenticationMiddleware>(TYPES.AuthenticationMiddleware);

  // =====================================================
  // TREATMENT PLAN CRUD ROUTES
  // =====================================================

  /**
   * Create new treatment plan
   * POST /api/v2/clinical-emr/treatment-plans
   * @access Doctor only (treatment planning authority)
   * @audit PHI Access - Create Treatment Plan
   */
  router.post(
    '/',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctor(), // Only doctors can create treatment plans
    (req, res, next) => controller.createPlan(req, res, next)
  );

  /**
   * Get treatment plan by ID
   * GET /api/v2/clinical-emr/treatment-plans/:planId
   * @access Healthcare Staff
   * @audit PHI Access - View Treatment Plan
   */
  router.get(
    '/:planId',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(),
    (req, res, next) => controller.getPlan(req, res, next)
  );

  /**
   * Update treatment plan
   * PUT /api/v2/clinical-emr/treatment-plans/:planId
   * @access Doctor (original author), Admin
   * @audit PHI Access - Update Treatment Plan
   */
  router.put(
    '/:planId',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    (req, res, next) => controller.updatePlan(req, res, next)
  );

  /**
   * Complete treatment plan (mark as finished)
   * POST /api/v2/clinical-emr/treatment-plans/:planId/complete
   * @access Doctor, Admin
   * @audit PHI Access - Complete Treatment Plan (Critical)
   */
  router.post(
    '/:planId/complete',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    (req, res, next) => controller.completePlan(req, res, next)
  );

  /**
   * List treatment plans with filtering
   * GET /api/v2/clinical-emr/treatment-plans
   * @access Healthcare Staff
   * @audit PHI Access - List Treatment Plans
   * @query patientId, status, startDate, endDate
   */
  router.get(
    '/',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(),
    (req, res, next) => controller.listPlans(req, res, next)
  );

  // =====================================================
  // ERROR HANDLING MIDDLEWARE
  // =====================================================
  
  router.use(errorHandlingMiddleware);

  return router;
}
