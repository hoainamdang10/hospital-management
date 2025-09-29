"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhancedMedicalRecordRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const enhanced_medical_record_controller_1 = require("../controllers/enhanced-medical-record.controller");
const hipaa_compliance_middleware_1 = require("../middleware/hipaa-compliance.middleware");
const metrics_service_1 = require("../services/metrics.service");
const router = (0, express_1.Router)();
exports.enhancedMedicalRecordRoutes = router;
// Middleware for API metrics
const metricsMiddleware = (req, res, next) => {
    const startTime = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        metrics_service_1.metricsService.recordAPIUsage(req.route?.path || req.path, req.method, res.statusCode, duration);
    });
    next();
};
// Apply middleware to all routes
router.use(metricsMiddleware);
router.use(hipaa_compliance_middleware_1.hipaaMiddleware.auditAccess);
router.use(hipaa_compliance_middleware_1.hipaaMiddleware.maskSensitiveData);
router.use(hipaa_compliance_middleware_1.hipaaMiddleware.rateLimitPHI);
// Validation schemas
const medicalRecordValidation = [
    (0, express_validator_1.body)("patient_id").isUUID().withMessage("Patient ID must be a valid UUID"),
    (0, express_validator_1.body)("doctor_id").isUUID().withMessage("Doctor ID must be a valid UUID"),
    (0, express_validator_1.body)("visit_date")
        .isISO8601()
        .withMessage("Visit date must be a valid ISO date"),
    (0, express_validator_1.body)("symptoms")
        .optional()
        .isLength({ min: 1, max: 5000 })
        .withMessage("Symptoms must be between 1 and 5000 characters"),
    (0, express_validator_1.body)("examination_notes")
        .optional()
        .isLength({ min: 1, max: 10000 })
        .withMessage("Examination notes must be between 1 and 10000 characters"),
    (0, express_validator_1.body)("diagnosis")
        .optional()
        .isLength({ min: 1, max: 2000 })
        .withMessage("Diagnosis must be between 1 and 2000 characters"),
    (0, express_validator_1.body)("treatment")
        .optional()
        .isLength({ min: 1, max: 5000 })
        .withMessage("Treatment must be between 1 and 5000 characters"),
    (0, express_validator_1.body)("medication")
        .optional()
        .isLength({ min: 1, max: 3000 })
        .withMessage("Medication must be between 1 and 3000 characters"),
    (0, express_validator_1.body)("allergies")
        .optional()
        .isLength({ min: 1, max: 1000 })
        .withMessage("Allergies must be between 1 and 1000 characters"),
    (0, express_validator_1.body)("vital_signs")
        .optional()
        .isObject()
        .withMessage("Vital signs must be an object"),
    (0, express_validator_1.body)("vital_signs.blood_pressure_systolic")
        .optional()
        .isInt({ min: 50, max: 300 })
        .withMessage("Systolic BP must be between 50 and 300"),
    (0, express_validator_1.body)("vital_signs.blood_pressure_diastolic")
        .optional()
        .isInt({ min: 30, max: 200 })
        .withMessage("Diastolic BP must be between 30 and 200"),
    (0, express_validator_1.body)("vital_signs.heart_rate")
        .optional()
        .isInt({ min: 30, max: 300 })
        .withMessage("Heart rate must be between 30 and 300"),
    (0, express_validator_1.body)("vital_signs.temperature")
        .optional()
        .isFloat({ min: 30.0, max: 45.0 })
        .withMessage("Temperature must be between 30.0 and 45.0"),
    (0, express_validator_1.body)("vital_signs.oxygen_saturation")
        .optional()
        .isInt({ min: 70, max: 100 })
        .withMessage("Oxygen saturation must be between 70 and 100"),
    (0, express_validator_1.body)("vital_signs.respiratory_rate")
        .optional()
        .isInt({ min: 8, max: 60 })
        .withMessage("Respiratory rate must be between 8 and 60"),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(["active", "archived", "deleted"])
        .withMessage("Status must be active, archived, or deleted"),
];
const updateValidation = [
    (0, express_validator_1.param)("id").isUUID().withMessage("Record ID must be a valid UUID"),
    ...medicalRecordValidation.map((validation) => validation.optional()),
];
const queryValidation = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    (0, express_validator_1.query)("search")
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage("Search term must be between 1 and 100 characters"),
    (0, express_validator_1.query)("date_from")
        .optional()
        .isISO8601()
        .withMessage("Date from must be a valid ISO date"),
    (0, express_validator_1.query)("date_to")
        .optional()
        .isISO8601()
        .withMessage("Date to must be a valid ISO date"),
    (0, express_validator_1.query)("doctor_id")
        .optional()
        .isUUID()
        .withMessage("Doctor ID must be a valid UUID"),
    (0, express_validator_1.query)("status")
        .optional()
        .isIn(["active", "archived", "deleted"])
        .withMessage("Status must be active, archived, or deleted"),
];
// Routes
/**
 * @route GET /api/medical-records
 * @desc Get all medical records with pagination and filtering
 * @access Private
 * @middleware HIPAA Compliance, Rate Limiting, Metrics
 */
router.get("/", queryValidation, enhanced_medical_record_controller_1.enhancedMedicalRecordController.getAllMedicalRecords.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController));
/**
 * @route GET /api/medical-records/patient/:patient_id
 * @desc Get all medical records for a specific patient
 * @access Private
 * @middleware HIPAA Compliance, Patient Validation, Cache
 */
router.get("/patient/:patient_id", [
    (0, express_validator_1.param)("patient_id").isUUID().withMessage("Patient ID must be a valid UUID"),
    ...queryValidation,
], enhanced_medical_record_controller_1.enhancedMedicalRecordController.getMedicalRecordsByPatient.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController));
/**
 * @route GET /api/medical-records/doctor/:doctor_id
 * @desc Get all medical records for a specific doctor
 * @access Private
 * @middleware HIPAA Compliance, Doctor Validation, Cache
 */
router.get("/doctor/:doctor_id", [
    (0, express_validator_1.param)("doctor_id").isUUID().withMessage("Doctor ID must be a valid UUID"),
    ...queryValidation,
], enhanced_medical_record_controller_1.enhancedMedicalRecordController.getMedicalRecordsByPatient.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController) // Will be implemented
);
/**
 * @route GET /api/medical-records/:id
 * @desc Get a specific medical record by ID
 * @access Private
 * @middleware HIPAA Compliance, Authorization
 */
router.get("/:id", [(0, express_validator_1.param)("id").isUUID().withMessage("Record ID must be a valid UUID")], enhanced_medical_record_controller_1.enhancedMedicalRecordController.getMedicalRecordsByPatient.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController) // Will be implemented
);
/**
 * @route POST /api/medical-records
 * @desc Create a new medical record
 * @access Private
 * @middleware HIPAA Compliance, Validation, Integration
 */
router.post("/", medicalRecordValidation, enhanced_medical_record_controller_1.enhancedMedicalRecordController.createMedicalRecord.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController));
/**
 * @route PUT /api/medical-records/:id
 * @desc Update a medical record
 * @access Private
 * @middleware HIPAA Compliance, Change Tracking, Notification
 */
router.put("/:id", updateValidation, enhanced_medical_record_controller_1.enhancedMedicalRecordController.updateMedicalRecord.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController));
/**
 * @route DELETE /api/medical-records/:id
 * @desc Soft delete a medical record
 * @access Private
 * @middleware HIPAA Compliance, Audit Logging
 */
router.delete("/:id", [(0, express_validator_1.param)("id").isUUID().withMessage("Record ID must be a valid UUID")], enhanced_medical_record_controller_1.enhancedMedicalRecordController.updateMedicalRecord.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController) // Will implement soft delete
);
/**
 * @route GET /api/medical-records/search
 * @desc Advanced search for medical records
 * @access Private
 * @middleware HIPAA Compliance, Cache, Performance Monitoring
 */
router.get("/search", [
    (0, express_validator_1.query)("q")
        .notEmpty()
        .isLength({ min: 3, max: 100 })
        .withMessage("Search query must be between 3 and 100 characters"),
    (0, express_validator_1.query)("type")
        .optional()
        .isIn(["symptoms", "diagnosis", "treatment", "medication", "all"])
        .withMessage("Search type must be symptoms, diagnosis, treatment, medication, or all"),
    ...queryValidation,
], enhanced_medical_record_controller_1.enhancedMedicalRecordController.getAllMedicalRecords.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController) // Will implement search
);
/**
 * @route GET /api/medical-records/analytics/summary
 * @desc Get analytics summary for medical records
 * @access Private - Admin only
 * @middleware HIPAA Compliance, Admin Authorization
 */
router.get("/analytics/summary", [
    (0, express_validator_1.query)("period")
        .optional()
        .isIn(["1d", "7d", "30d", "90d", "1y"])
        .withMessage("Period must be 1d, 7d, 30d, 90d, or 1y"),
    (0, express_validator_1.query)("group_by")
        .optional()
        .isIn(["doctor", "department", "diagnosis", "date"])
        .withMessage("Group by must be doctor, department, diagnosis, or date"),
], enhanced_medical_record_controller_1.enhancedMedicalRecordController.getAllMedicalRecords.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController) // Will implement analytics
);
/**
 * @route GET /api/medical-records/health
 * @desc Get service health and performance metrics
 * @access Private - Admin only
 */
router.get("/health", enhanced_medical_record_controller_1.enhancedMedicalRecordController.getHealthMetrics.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController));
/**
 * @route POST /api/medical-records/bulk
 * @desc Bulk create medical records
 * @access Private - Admin only
 * @middleware HIPAA Compliance, Bulk Validation
 */
router.post("/bulk", [
    (0, express_validator_1.body)("records")
        .isArray({ min: 1, max: 100 })
        .withMessage("Records must be an array with 1-100 items"),
    (0, express_validator_1.body)("records.*").isObject().withMessage("Each record must be an object"),
], enhanced_medical_record_controller_1.enhancedMedicalRecordController.createMedicalRecord.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController) // Will implement bulk
);
/**
 * @route GET /api/medical-records/export
 * @desc Export medical records (with data masking for HIPAA)
 * @access Private - Authorized roles only
 * @middleware HIPAA Compliance, Export Authorization
 */
router.get("/export", [
    (0, express_validator_1.query)("format")
        .optional()
        .isIn(["json", "csv", "pdf"])
        .withMessage("Export format must be json, csv, or pdf"),
    (0, express_validator_1.query)("patient_ids")
        .optional()
        .custom((value) => {
        if (value) {
            const ids = value.split(",");
            return ids.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
        }
        return true;
    })
        .withMessage("Patient IDs must be valid UUIDs separated by commas"),
    ...queryValidation,
], enhanced_medical_record_controller_1.enhancedMedicalRecordController.getAllMedicalRecords.bind(enhanced_medical_record_controller_1.enhancedMedicalRecordController) // Will implement export
);
//# sourceMappingURL=enhanced-medical-record.routes.js.map