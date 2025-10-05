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
 */
function createPatientRoutes(controller) {
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
    /**
     * Search patients
     * GET /api/v1/patients/search?searchTerm=...
     */
    router.get('/search', ValidationMiddleware_1.validateSearchPatients, asyncHandler(controller.searchPatients.bind(controller)));
    /**
     * Match patients (PMI)
     * POST /api/v1/patients/match
     */
    router.post('/match', ValidationMiddleware_1.validateMatchPatients, asyncHandler(controller.matchPatients.bind(controller)));
    // ==================== PATIENT OPERATIONS ====================
    /**
     * Merge patients
     * POST /api/v1/patients/merge
     */
    router.post('/merge', ValidationMiddleware_1.validateMergePatients, asyncHandler(controller.mergePatients.bind(controller)));
    // ==================== GET PATIENT ROUTES ====================
    /**
     * Get patient by user ID
     * GET /api/v1/patients/user/:userId
     */
    router.get('/user/:userId', ValidationMiddleware_1.validateUserId, asyncHandler(controller.getPatientByUserId.bind(controller)));
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
    router.put('/:patientId', ValidationMiddleware_1.validateUpdatePatient, asyncHandler(controller.updatePatient.bind(controller)));
    /**
     * Link patients
     * POST /api/v1/patients/:patientId/link
     */
    router.post('/:patientId/link', ValidationMiddleware_1.validateLinkPatients, asyncHandler(controller.linkPatients.bind(controller)));
    /**
     * Deactivate patient
     * POST /api/v1/patients/:patientId/deactivate
     */
    router.post('/:patientId/deactivate', ValidationMiddleware_1.validatePatientId, asyncHandler(controller.deactivatePatient.bind(controller)));
    /**
     * Add emergency contact
     * POST /api/v1/patients/:patientId/emergency-contacts
     */
    router.post('/:patientId/emergency-contacts', ValidationMiddleware_1.validatePatientId, asyncHandler(controller.addEmergencyContact.bind(controller)));
    /**
     * Grant consent
     * POST /api/v1/patients/:patientId/consents
     */
    router.post('/:patientId/consents', ValidationMiddleware_1.validatePatientId, asyncHandler(controller.grantConsent.bind(controller)));
    /**
     * Mark patient as deceased
     * POST /api/v1/patients/:patientId/mark-deceased
     */
    router.post('/:patientId/mark-deceased', ValidationMiddleware_1.validatePatientId, asyncHandler(controller.markAsDeceased.bind(controller)));
    /**
     * Reactivate patient
     * POST /api/v1/patients/:patientId/reactivate
     */
    router.post('/:patientId/reactivate', ValidationMiddleware_1.validatePatientId, asyncHandler(controller.reactivatePatient.bind(controller)));
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