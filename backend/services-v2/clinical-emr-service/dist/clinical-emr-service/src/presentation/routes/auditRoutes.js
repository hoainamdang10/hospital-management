"use strict";
/**
 * Audit Routes - Presentation Layer
 * Routes for HIPAA audit logs
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditRoutes = createAuditRoutes;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const express_validator_1 = require("express-validator");
function createAuditRoutes(auditController) {
    const router = (0, express_1.Router)();
    /**
     * GET /api/v2/clinical-emr/audit-logs
     * Get PHI access audit logs (HIPAA compliance)
     * Authorization: SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER only
     */
    router.get('/audit-logs', auth_middleware_1.authenticateJWT, [
        (0, express_validator_1.query)('patientId').optional().isString(),
        (0, express_validator_1.query)('userId').optional().isString(),
        (0, express_validator_1.query)('action').optional().isIn(['read', 'write', 'print', 'export', 'delete', 'update']),
        (0, express_validator_1.query)('startDate').optional().isISO8601(),
        (0, express_validator_1.query)('endDate').optional().isISO8601(),
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt()
    ], validation_middleware_1.validateRequest, (req, res) => auditController.getAuditLogs(req, res));
    return router;
}
//# sourceMappingURL=auditRoutes.js.map