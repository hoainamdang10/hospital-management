/**
 * Patient Routes
 * Express routes for Patient Registry API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance RESTful API, Clean Architecture
 */

import { Router } from 'express';
import { PatientController } from '../controllers/PatientController';
import { ErrorHandlingMiddleware } from '../middleware/ErrorHandlingMiddleware';
import {
  validateRegisterPatient,
  validateUpdatePatient,
  validatePatientId,
  validateUserId,
  validateNationalId,
  validateBHYTNumber,
  validateSearchPatients,
  validateMatchPatients,
  validateMergePatients,
  validateLinkPatients
} from '../middleware/ValidationMiddleware';

/**
 * Create patient routes
 */
export function createPatientRoutes(controller: PatientController): Router {
  const router = Router();
  const asyncHandler = ErrorHandlingMiddleware.asyncHandler;

  // ==================== PUBLIC ROUTES ====================

  /**
   * Register new patient
   * POST /api/v1/patients
   */
  router.post(
    '/',
    validateRegisterPatient,
    asyncHandler(controller.registerPatient.bind(controller))
  );

  /**
   * Validate insurance
   * POST /api/v1/patients/validate-insurance
   */
  router.post(
    '/validate-insurance',
    asyncHandler(controller.validateInsurance.bind(controller))
  );

  // ==================== SEARCH & MATCH ROUTES ====================

  /**
   * Search patients
   * GET /api/v1/patients/search?searchTerm=...
   */
  router.get(
    '/search',
    validateSearchPatients,
    asyncHandler(controller.searchPatients.bind(controller))
  );

  /**
   * Match patients (PMI)
   * POST /api/v1/patients/match
   */
  router.post(
    '/match',
    validateMatchPatients,
    asyncHandler(controller.matchPatients.bind(controller))
  );

  // ==================== PATIENT OPERATIONS ====================

  /**
   * Merge patients
   * POST /api/v1/patients/merge
   */
  router.post(
    '/merge',
    validateMergePatients,
    asyncHandler(controller.mergePatients.bind(controller))
  );

  // ==================== GET PATIENT ROUTES ====================

  /**
   * Get patient by user ID
   * GET /api/v1/patients/user/:userId
   */
  router.get(
    '/user/:userId',
    validateUserId,
    asyncHandler(controller.getPatientByUserId.bind(controller))
  );

  /**
   * Get patient by national ID
   * GET /api/v1/patients/national-id/:nationalId
   */
  router.get(
    '/national-id/:nationalId',
    validateNationalId,
    asyncHandler(controller.getPatientByNationalId.bind(controller))
  );

  /**
   * Get patient by BHYT number
   * GET /api/v1/patients/bhyt/:bhytNumber
   */
  router.get(
    '/bhyt/:bhytNumber',
    validateBHYTNumber,
    asyncHandler(controller.getPatientByBHYTNumber.bind(controller))
  );

  /**
   * Get patient by ID
   * GET /api/v1/patients/:patientId
   */
  router.get(
    '/:patientId',
    validatePatientId,
    asyncHandler(controller.getPatientById.bind(controller))
  );

  // ==================== UPDATE PATIENT ROUTES ====================

  /**
   * Update patient information
   * PUT /api/v1/patients/:patientId
   */
  router.put(
    '/:patientId',
    validateUpdatePatient,
    asyncHandler(controller.updatePatient.bind(controller))
  );

  /**
   * Link patients
   * POST /api/v1/patients/:patientId/link
   */
  router.post(
    '/:patientId/link',
    validateLinkPatients,
    asyncHandler(controller.linkPatients.bind(controller))
  );

  /**
   * Deactivate patient
   * POST /api/v1/patients/:patientId/deactivate
   */
  router.post(
    '/:patientId/deactivate',
    validatePatientId,
    asyncHandler(controller.deactivatePatient.bind(controller))
  );

  /**
   * Add emergency contact
   * POST /api/v1/patients/:patientId/emergency-contacts
   */
  router.post(
    '/:patientId/emergency-contacts',
    validatePatientId,
    asyncHandler(controller.addEmergencyContact.bind(controller))
  );

  /**
   * Grant consent
   * POST /api/v1/patients/:patientId/consents
   */
  router.post(
    '/:patientId/consents',
    validatePatientId,
    asyncHandler(controller.grantConsent.bind(controller))
  );

  /**
   * Mark patient as deceased
   * POST /api/v1/patients/:patientId/mark-deceased
   */
  router.post(
    '/:patientId/mark-deceased',
    validatePatientId,
    asyncHandler(controller.markAsDeceased.bind(controller))
  );

  /**
   * Reactivate patient
   * POST /api/v1/patients/:patientId/reactivate
   */
  router.post(
    '/:patientId/reactivate',
    validatePatientId,
    asyncHandler(controller.reactivatePatient.bind(controller))
  );

  return router;
}

/**
 * API Documentation
 *
 * Base URL: /api/v1/patients
 *
 * Endpoints:
 *
 * 1. POST /
 *    - Register new patient
 *    - Body: RegisterPatientRequest
 *    - Response: PatientResponse
 *
 * 2. GET /:patientId
 *    - Get patient by ID
 *    - Params: patientId (PAT-YYYYMM-XXX)
 *    - Response: PatientResponse
 *
 * 3. GET /user/:userId
 *    - Get patient by user ID
 *    - Params: userId (UUID)
 *    - Response: PatientResponse
 *
 * 4. GET /national-id/:nationalId
 *    - Get patient by national ID (CMND/CCCD)
 *    - Params: nationalId (9 or 12 digits)
 *    - Response: PatientResponse
 *
 * 5. GET /bhyt/:bhytNumber
 *    - Get patient by BHYT number
 *    - Params: bhytNumber (XX-Y-ZZ-YYYY-NNNNN-CCCCC)
 *    - Response: PatientResponse
 *
 * 6. PUT /:patientId
 *    - Update patient information
 *    - Params: patientId
 *    - Body: UpdatePatientRequest
 *    - Response: PatientResponse
 *
 * 7. GET /search
 *    - Search patients
 *    - Query: searchTerm, isActive, page, limit
 *    - Response: PaginatedPatientsResponse
 *
 * 8. POST /match
 *    - Match patients (PMI)
 *    - Body: MatchPatientsRequest
 *    - Response: PatientMatchResponse[]
 *
 * 9. POST /merge
 *    - Merge duplicate patients
 *    - Body: MergePatientsRequest
 *    - Response: Success message
 *
 * 10. POST /:patientId/link
 *     - Link patients (FHIR-style)
 *     - Params: patientId
 *     - Body: LinkPatientsRequest
 *     - Response: Success message
 *
 * 11. POST /:patientId/deactivate
 *     - Deactivate patient
 *     - Params: patientId
 *     - Body: { reason: string }
 *     - Response: Success message
 *
 * 12. POST /validate-insurance
 *     - Validate insurance number
 *     - Body: { insuranceNumber: string, insuranceType: 'BHYT' | 'BHTN' }
 *     - Response: ValidationResult
 *
 * 13. POST /:patientId/emergency-contacts
 *     - Add emergency contact
 *     - Params: patientId
 *     - Body: AddEmergencyContactRequest
 *     - Response: Success message with contactId
 *
 * 14. POST /:patientId/consents
 *     - Grant consent
 *     - Params: patientId
 *     - Body: GrantConsentRequest
 *     - Response: Success message with consentId
 *
 * 15. POST /:patientId/mark-deceased
 *     - Mark patient as deceased
 *     - Params: patientId
 *     - Response: Success message
 *
 * 16. POST /:patientId/reactivate
 *     - Reactivate patient
 *     - Params: patientId
 *     - Body: { reason: string }
 *     - Response: Success message
 */

