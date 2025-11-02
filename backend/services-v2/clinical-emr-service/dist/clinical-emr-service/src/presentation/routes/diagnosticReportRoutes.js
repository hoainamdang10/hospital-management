"use strict";
/**
 * Diagnostic Report Routes - RESTful API Endpoints
 * Presentation Layer - Routes for diagnostic reports (lab, imaging, pathology)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDiagnosticReportRoutes = createDiagnosticReportRoutes;
const express_1 = require("express");
const container_1 = require("../../infrastructure/di/container");
const types_1 = require("../../infrastructure/di/types");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Create diagnostic report routes with authentication and authorization
 */
function createDiagnosticReportRoutes(controller) {
    const router = (0, express_1.Router)();
    // Get authentication middleware from DI container
    const authMiddleware = container_1.container.get(types_1.TYPES.AuthenticationMiddleware);
    // =====================================================
    // DIAGNOSTIC REPORT CRUD ROUTES
    // =====================================================
    /**
     * Create new diagnostic report
     * POST /api/v2/clinical-emr/diagnostic-reports
     * @access Doctor, Lab Technician, Admin
     * @audit PHI Access - Create Diagnostic Report
     */
    router.post('/', authMiddleware.authenticate(), authMiddleware.requireHealthcareStaff(), // Doctor, Nurse (Lab Tech), Admin
    (req, res, next) => controller.createReport(req, res, next));
    /**
     * Get diagnostic report by ID
     * GET /api/v2/clinical-emr/diagnostic-reports/:reportId
     * @access Healthcare Staff
     * @audit PHI Access - View Diagnostic Report
     */
    router.get('/:reportId', authMiddleware.authenticate(), authMiddleware.requireHealthcareStaff(), (req, res, next) => controller.getReport(req, res, next));
    /**
     * Update diagnostic report
     * PUT /api/v2/clinical-emr/diagnostic-reports/:reportId
     * @access Doctor, Lab Technician (original author), Admin
     * @audit PHI Access - Update Diagnostic Report
     */
    router.put('/:reportId', authMiddleware.authenticate(), authMiddleware.requireHealthcareStaff(), (req, res, next) => controller.updateReport(req, res, next));
    /**
     * Finalize diagnostic report (mark as complete and verified)
     * POST /api/v2/clinical-emr/diagnostic-reports/:reportId/finalize
     * @access Doctor, Admin (quality control)
     * @audit PHI Access - Finalize Diagnostic Report (Critical)
     */
    router.post('/:reportId/finalize', authMiddleware.authenticate(), authMiddleware.requireDoctorOrAdmin(), // Only doctors/admins can finalize
    (req, res, next) => controller.finalizeReport(req, res, next));
    /**
     * List diagnostic reports with filtering
     * GET /api/v2/clinical-emr/diagnostic-reports
     * @access Healthcare Staff
     * @audit PHI Access - List Diagnostic Reports
     * @query patientId, type, status, startDate, endDate
     */
    router.get('/', authMiddleware.authenticate(), authMiddleware.requireHealthcareStaff(), (req, res, next) => controller.listReports(req, res, next));
    // =====================================================
    // ERROR HANDLING MIDDLEWARE
    // =====================================================
    router.use(errorHandler_1.errorHandlingMiddleware);
    return router;
}
//# sourceMappingURL=diagnosticReportRoutes.js.map