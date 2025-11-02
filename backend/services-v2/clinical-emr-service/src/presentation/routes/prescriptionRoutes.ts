/**
 * Prescription Routes - RESTful API Endpoints
 * Presentation Layer - Routes for medication prescriptions
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA, Drug Control Laws
 */

import { Router } from 'express';
import { container } from '../../infrastructure/di/container';
import { TYPES } from '../../infrastructure/di/types';
import { PrescriptionController } from '../controllers/PrescriptionController';
import { AuthenticationMiddleware } from '../middleware/AuthenticationMiddleware';
import { errorHandlingMiddleware } from '../middleware/errorHandler';

/**
 * Create prescription routes with authentication and authorization
 */
export function createPrescriptionRoutes(controller: PrescriptionController): Router {
  const router = Router();
  
  // Get authentication middleware from DI container
  const authMiddleware = container.get<AuthenticationMiddleware>(TYPES.AuthenticationMiddleware);

  // =====================================================
  // PRESCRIPTION CRUD ROUTES
  // =====================================================

  /**
   * Create new prescription
   * POST /api/v2/clinical-emr/prescriptions
   * @access Doctor only (prescribing authority required)
   * @audit PHI Access - Create Prescription (Critical - Drug Control)
   */
  router.post(
    '/',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctor(), // Only doctors can prescribe
    (req, res, next) => controller.createPrescription(req, res, next)
  );

  /**
   * Get prescription by ID
   * GET /api/v2/clinical-emr/prescriptions/:prescriptionId
   * @access Doctor, Pharmacist (Nurse), Admin
   * @audit PHI Access - View Prescription
   */
  router.get(
    '/:prescriptionId',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(), // Healthcare staff can view
    (req, res, next) => controller.getPrescription(req, res, next)
  );

  /**
   * Dispense prescription (mark as filled by pharmacy)
   * POST /api/v2/clinical-emr/prescriptions/:prescriptionId/dispense
   * @access Pharmacist (Nurse role), Doctor, Admin
   * @audit PHI Access - Dispense Prescription (Critical - Drug Control)
   */
  router.post(
    '/:prescriptionId/dispense',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(), // Healthcare staff can dispense
    (req, res, next) => controller.dispensePrescription(req, res, next)
  );

  /**
   * List prescriptions with filtering
   * GET /api/v2/clinical-emr/prescriptions
   * @access Healthcare Staff
   * @audit PHI Access - List Prescriptions
   * @query patientId, prescriberId, status, startDate, endDate
   */
  router.get(
    '/',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(),
    (req, res, next) => controller.listPrescriptions(req, res, next)
  );

  // =====================================================
  // ERROR HANDLING MIDDLEWARE
  // =====================================================
  
  router.use(errorHandlingMiddleware);

  return router;
}
