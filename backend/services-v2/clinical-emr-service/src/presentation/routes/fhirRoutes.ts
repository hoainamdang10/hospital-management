/**
 * FHIR Routes - Presentation Layer
 * Routes for FHIR R4 export
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router } from 'express';
import { FHIRController } from '../controllers/FHIRController';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body } from 'express-validator';

export function createFHIRRoutes(fhirController: FHIRController): Router {
  const router = Router();

  /**
   * POST /api/v2/clinical-emr/fhir/export
   * Bulk export medical records in FHIR R4 format
   * Authorization: SUPER_ADMIN, ADMIN, DOCTOR
   */
  router.post(
    '/fhir/export',
    authenticateJWT,
    [
      body('patientIds').optional().isArray(),
      body('patientIds.*').optional().isString(),
      body('resourceTypes').optional().isArray(),
      body('resourceTypes.*').optional().isIn([
        'Patient', 'Observation', 'Condition', 'MedicationRequest',
        'DiagnosticReport', 'Procedure', 'Encounter'
      ]),
      body('startDate').optional().isISO8601(),
      body('endDate').optional().isISO8601(),
      body('format').optional().isIn(['json', 'xml', 'ndjson']),
      body('async').optional().isBoolean()
    ],
    validateRequest,
    (req, res) => fhirController.bulkExportFHIR(req, res)
  );

  return router;
}

