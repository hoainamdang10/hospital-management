"use strict";
/**
 * Patient Routes
 * Express routes for Patient Registry API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance RESTful API, Clean Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPatientRoutes = createPatientRoutes;
const express_1 = require("express");
const ErrorHandlingMiddleware_1 = require("../middleware/ErrorHandlingMiddleware");
const ValidationMiddleware_1 = require("../middleware/ValidationMiddleware");
/**
 * Create patient routes
 * @param controller - Patient controller instance
 * @param authorizationMiddleware - Authorization middleware for ownership checks
 */
function createPatientRoutes(controller, authorizationMiddleware) {
    const router = (0, express_1.Router)();
    const asyncHandler = ErrorHandlingMiddleware_1.ErrorHandlingMiddleware.asyncHandler;
    // ==================== PUBLIC ROUTES ====================
    /**
     * Register new patient
     * POST /api/v1/patients
     */
    router.post('/', ValidationMiddleware_1.validateRegisterPatient, asyncHandler(controller.registerPatient.bind(controller)));
    /**
     * Validate insurance
     * POST /api/v1/patients/validate-insurance
     */
    router.post('/validate-insurance', asyncHandler(controller.validateInsurance.bind(controller)));
    // ==================== SEARCH & MATCH ROUTES ====================
    /* POST-MVP: Analytics - Not required for graduation project demo flows
    **
     * Get patient statistics
     * GET /api/v1/patients/statistics
     *
    router.get(
      '/statistics',
      asyncHandler(controller.getStatistics.bind(controller)),
    );
    END POST-MVP: Analytics */
    /**
     * Search patients
     * GET /api/v1/patients/search?searchTerm=...
     */
    router.get('/search', ValidationMiddleware_1.validateSearchPatients, asyncHandler(controller.searchPatients.bind(controller)));
    /**
     * Get patient list with pagination
     * GET /api/v1/patients?page=1&limit=20
     */
    router.get('/', ValidationMiddleware_1.validateGetPatientList, asyncHandler(controller.getPatientList.bind(controller)));
    /* POST-MVP: PMI Features (Patient Master Index) - Not required for graduation project
    **
     * Match patients (PMI)
     * POST /api/v1/patients/match
     *
    router.post(
      '/match',
      validateMatchPatients,
      asyncHandler(controller.matchPatients.bind(controller)),
    );
    END POST-MVP: PMI Features */
    // ==================== PATIENT OPERATIONS ====================
    /* POST-MVP: PMI Features (Patient Master Index) - Not required for graduation project
    **
     * Merge patients
     * POST /api/v1/patients/merge
     *
    router.post(
      '/merge',
      validateMergePatients,
      asyncHandler(controller.mergePatients.bind(controller)),
    );
    END POST-MVP: PMI Features */
    // ==================== GET PATIENT ROUTES ====================
    /**
     * Get patient by user ID
     * GET /api/v1/patients/user/:userId
     * Authorization: Patient can access own data, Admin/Doctor need patient:read permission
     */
    router.get('/user/:userId', ValidationMiddleware_1.validateUserId, authorizationMiddleware.canAccessPatientData('userId'), asyncHandler(controller.getPatientByUserId.bind(controller)));
    /**
     * Get patient by national ID
     * GET /api/v1/patients/national-id/:nationalId
     */
    router.get('/national-id/:nationalId', ValidationMiddleware_1.validateNationalId, asyncHandler(controller.getPatientByNationalId.bind(controller)));
    /**
     * Get patient by BHYT number
     * GET /api/v1/patients/bhyt/:bhytNumber
     */
    router.get('/bhyt/:bhytNumber', ValidationMiddleware_1.validateBHYTNumber, asyncHandler(controller.getPatientByBHYTNumber.bind(controller)));
    /* POST-MVP: Audit Trail - Advanced analytics not required for graduation project
    **
     * Get patient history (audit logs and access logs)
     * GET /api/v1/patients/:patientId/history
     *
    router.get(
      '/:patientId/history',
      validatePatientId,
      asyncHandler(controller.getPatientHistory.bind(controller)),
    );
    END POST-MVP: Audit Trail */
    /**
     * Get patient by ID
     * GET /api/v1/patients/:patientId
     */
    router.get('/:patientId', ValidationMiddleware_1.validatePatientId, asyncHandler(controller.getPatientById.bind(controller)));
    // ==================== UPDATE PATIENT ROUTES ====================
    /**
     * Update patient information
     * PUT /api/v1/patients/:patientId
     */
    router.put('/:patientId', ValidationMiddleware_1.validateUpdatePatient, authorizationMiddleware.canAccessPatientData('patientId'), asyncHandler(controller.updatePatient.bind(controller)));
    /* POST-MVP: FHIR Advanced - Patient Linking not required for graduation project
    **
     * Link patients
     * POST /api/v1/patients/:patientId/link
     *
    router.post(
      '/:patientId/link',
      validateLinkPatients,
      asyncHandler(controller.linkPatients.bind(controller)),
    );
    END POST-MVP: FHIR Advanced - Patient Linking */
    /* POST-MVP: Patient Lifecycle - Deactivation not required for graduation project
    **
     * Deactivate patient
     * POST /api/v1/patients/:patientId/deactivate
     *
    router.post(
      '/:patientId/deactivate',
      validatePatientId,
      asyncHandler(controller.deactivatePatient.bind(controller)),
    );
    END POST-MVP: Patient Lifecycle - Deactivation */
    /**
     * Add emergency contact
     * POST /api/v1/patients/:patientId/emergency-contacts
     */
    router.post('/:patientId/emergency-contacts', ValidationMiddleware_1.validateAddEmergencyContact, asyncHandler(controller.addEmergencyContact.bind(controller)));
    /**
     * Get emergency contacts
     * GET /api/v1/patients/:patientId/emergency-contacts
     */
    router.get('/:patientId/emergency-contacts', ValidationMiddleware_1.validatePatientId, asyncHandler(controller.getEmergencyContacts.bind(controller)));
    /**
     * Update emergency contact
     * PUT /api/v1/patients/:patientId/emergency-contacts/:contactId
     */
    router.put('/:patientId/emergency-contacts/:contactId', ValidationMiddleware_1.validateUpdateEmergencyContact, asyncHandler(controller.updateEmergencyContact.bind(controller)));
    /* POST-MVP: Advanced Emergency Contact Management - Not required for graduation project
    **
     * Remove emergency contact
     * DELETE /api/v1/patients/:patientId/emergency-contacts/:contactId
     *
    router.delete(
      '/:patientId/emergency-contacts/:contactId',
      validateRemoveEmergencyContact,
      asyncHandler(controller.removeEmergencyContact.bind(controller)),
    );
  
    **
     * Set primary emergency contact
     * PUT /api/v1/patients/:patientId/emergency-contacts/:contactId/set-primary
     *
    router.put(
      '/:patientId/emergency-contacts/:contactId/set-primary',
      validatePatientId,
      asyncHandler(controller.setPrimaryEmergencyContact.bind(controller)),
    );
    END POST-MVP: Advanced Emergency Contact Management */
    // ==================== PHOTO MANAGEMENT (FHIR: photo field) ====================
    /* POST-MVP: FHIR Photo Management - Patient.photo field not needed for graduation project
    **
     * Upload patient photo
     * POST /api/v1/patients/:patientId/photo
     *
    router.post(
      '/:patientId/photo',
      validatePatientId,
      upload.single('photo'),
      asyncHandler(controller.uploadPhoto.bind(controller)),
    );
  
    **
     * Get patient photo
     * GET /api/v1/patients/:patientId/photo
     *
    router.get(
      '/:patientId/photo',
      validatePatientId,
      asyncHandler(controller.getPhoto.bind(controller)),
    );
  
    **
     * Delete patient photo
     * DELETE /api/v1/patients/:patientId/photo
     *
    router.delete(
      '/:patientId/photo',
      validatePatientId,
      asyncHandler(controller.deletePhoto.bind(controller)),
    );
    END POST-MVP: FHIR Photo Management */
    // ==================== COMMUNICATION PREFERENCES (FHIR: communication field) ====================
    /* POST-MVP: FHIR Communication Preferences - Patient.communication field not needed for graduation project
    **
     * Update communication preferences
     * PUT /api/v1/patients/:patientId/communication
     *
    router.put(
      '/:patientId/communication',
      validatePatientId,
      asyncHandler(controller.updateCommunicationPreferences.bind(controller)),
    );
  
    **
     * Get communication preferences
     * GET /api/v1/patients/:patientId/communication
     *
    router.get(
      '/:patientId/communication',
      validatePatientId,
      asyncHandler(controller.getCommunicationPreferences.bind(controller)),
    );
    END POST-MVP: FHIR Communication Preferences */
    // ==================== CONSENT MANAGEMENT ====================
    /* POST-MVP: HIPAA Consent Management - Not required for graduation project
    **
     * Grant consent
     * POST /api/v1/patients/:patientId/consents
     *
    router.post(
      '/:patientId/consents',
      validateGrantConsent,
      asyncHandler(controller.grantConsent.bind(controller)),
    );
  
    **
     * Get all consents
     * GET /api/v1/patients/:patientId/consents
     *
    router.get(
      '/:patientId/consents',
      validatePatientId,
      asyncHandler(controller.getConsents.bind(controller)),
    );
  
    **
     * Get active consents only
     * GET /api/v1/patients/:patientId/consents/active
     *
    router.get(
      '/:patientId/consents/active',
      validatePatientId,
      asyncHandler(controller.getActiveConsents.bind(controller)),
    );
  
    **
     * Get consent details
     * GET /api/v1/patients/:patientId/consents/:consentId
     *
    router.get(
      '/:patientId/consents/:consentId',
      validatePatientId,
      asyncHandler(controller.getConsentDetails.bind(controller)),
    );
  
    **
     * Revoke consent
     * POST /api/v1/patients/:patientId/consents/:consentId/revoke
     *
    router.post(
      '/:patientId/consents/:consentId/revoke',
      validateRevokeConsent,
      asyncHandler(controller.revokeConsent.bind(controller)),
    );
    END POST-MVP: HIPAA Consent Management */
    /**
     * Get insurance info
     * GET /api/v1/patients/:patientId/insurance
     */
    router.get('/:patientId/insurance', ValidationMiddleware_1.validatePatientId, asyncHandler(controller.getInsuranceInfo.bind(controller)));
    /**
     * Add insurance info
     * POST /api/v1/patients/:patientId/insurance
     */
    router.post('/:patientId/insurance', ValidationMiddleware_1.validatePatientId, ValidationMiddleware_1.validateAddInsuranceInfo, asyncHandler(controller.addInsuranceInfo.bind(controller)));
    /**
     * Update insurance info
     * PUT /api/v1/patients/:patientId/insurance
     */
    router.put('/:patientId/insurance', ValidationMiddleware_1.validatePatientId, asyncHandler(controller.updateInsuranceInfo.bind(controller)));
    /**
     * Verify insurance
     * POST /api/v1/patients/:patientId/insurance/verify
     */
    router.post('/:patientId/insurance/verify', ValidationMiddleware_1.validatePatientId, asyncHandler(controller.verifyInsurance.bind(controller)));
    /* POST-MVP: Patient Lifecycle - Deceased/Reactivation not required for graduation project
    /**
     * Mark patient as deceased
     * POST /api/v1/patients/:patientId/mark-deceased
     *
    router.post(
      '/:patientId/mark-deceased',
      validatePatientId,
      asyncHandler(controller.markAsDeceased.bind(controller)),
    );
  
    /**
     * Reactivate patient
     * POST /api/v1/patients/:patientId/reactivate
     *
    router.post(
      '/:patientId/reactivate',
      validatePatientId,
      asyncHandler(controller.reactivatePatient.bind(controller)),
    );
    END POST-MVP: Patient Lifecycle - Deceased/Reactivation */
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
//# sourceMappingURL=patientRoutes.js.map