"use strict";
/**
 * FHIR Routes - Presentation Layer
 * Routes for FHIR R4 export
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFHIRRoutes = createFHIRRoutes;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const express_validator_1 = require("express-validator");
function createFHIRRoutes(fhirController) {
    const router = (0, express_1.Router)();
    /**
     * POST /api/v2/clinical-emr/fhir/export
     * Bulk export medical records in FHIR R4 format
     * Authorization: SUPER_ADMIN, ADMIN, DOCTOR
     */
    router.post('/fhir/export', auth_middleware_1.authenticateJWT, [
        (0, express_validator_1.body)('patientIds').optional().isArray(),
        (0, express_validator_1.body)('patientIds.*').optional().isString(),
        (0, express_validator_1.body)('resourceTypes').optional().isArray(),
        (0, express_validator_1.body)('resourceTypes.*').optional().isIn([
            'Patient', 'Observation', 'Condition', 'MedicationRequest',
            'DiagnosticReport', 'Procedure', 'Encounter'
        ]),
        (0, express_validator_1.body)('startDate').optional().isISO8601(),
        (0, express_validator_1.body)('endDate').optional().isISO8601(),
        (0, express_validator_1.body)('format').optional().isIn(['json', 'xml', 'ndjson']),
        (0, express_validator_1.body)('async').optional().isBoolean()
    ], validation_middleware_1.validateRequest, (req, res) => fhirController.bulkExportFHIR(req, res));
    return router;
}
//# sourceMappingURL=fhirRoutes.js.map