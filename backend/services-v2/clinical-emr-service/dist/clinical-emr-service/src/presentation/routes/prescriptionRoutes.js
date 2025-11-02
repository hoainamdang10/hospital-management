"use strict";
/**
 * Prescription Routes - RESTful API Endpoints
 * Presentation Layer - Routes for medication prescriptions
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA, Drug Control Laws
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrescriptionRoutes = createPrescriptionRoutes;
const express_1 = require("express");
const container_1 = require("../../infrastructure/di/container");
const types_1 = require("../../infrastructure/di/types");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Create prescription routes with authentication and authorization
 */
function createPrescriptionRoutes(controller) {
    const router = (0, express_1.Router)();
    // Get authentication middleware from DI container
    const authMiddleware = container_1.container.get(types_1.TYPES.AuthenticationMiddleware);
    // =====================================================
    // PRESCRIPTION CRUD ROUTES
    // =====================================================
    /**
     * Create new prescription
     * POST /api/v2/clinical-emr/prescriptions
     * @access Doctor only (prescribing authority required)
     * @audit PHI Access - Create Prescription (Critical - Drug Control)
     */
    router.post('/', authMiddleware.authenticate(), authMiddleware.requireDoctor(), // Only doctors can prescribe
    (req, res, next) => controller.createPrescription(req, res, next));
    /**
     * Get prescription by ID
     * GET /api/v2/clinical-emr/prescriptions/:prescriptionId
     * @access Doctor, Pharmacist (Nurse), Admin
     * @audit PHI Access - View Prescription
     */
    router.get('/:prescriptionId', authMiddleware.authenticate(), authMiddleware.requireHealthcareStaff(), // Healthcare staff can view
    (req, res, next) => controller.getPrescription(req, res, next));
    /**
     * Dispense prescription (mark as filled by pharmacy)
     * POST /api/v2/clinical-emr/prescriptions/:prescriptionId/dispense
     * @access Pharmacist (Nurse role), Doctor, Admin
     * @audit PHI Access - Dispense Prescription (Critical - Drug Control)
     */
    router.post('/:prescriptionId/dispense', authMiddleware.authenticate(), authMiddleware.requireHealthcareStaff(), // Healthcare staff can dispense
    (req, res, next) => controller.dispensePrescription(req, res, next));
    /**
     * List prescriptions with filtering
     * GET /api/v2/clinical-emr/prescriptions
     * @access Healthcare Staff
     * @audit PHI Access - List Prescriptions
     * @query patientId, prescriberId, status, startDate, endDate
     */
    router.get('/', authMiddleware.authenticate(), authMiddleware.requireHealthcareStaff(), (req, res, next) => controller.listPrescriptions(req, res, next));
    // =====================================================
    // ERROR HANDLING MIDDLEWARE
    // =====================================================
    router.use(errorHandler_1.errorHandlingMiddleware);
    return router;
}
//# sourceMappingURL=prescriptionRoutes.js.map