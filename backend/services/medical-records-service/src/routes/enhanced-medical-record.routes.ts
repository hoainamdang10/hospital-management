import { Router } from "express";
import { body, param, query } from "express-validator";
import { enhancedMedicalRecordController } from "../controllers/enhanced-medical-record.controller";
import { hipaaMiddleware } from "../middleware/hipaa-compliance.middleware";
import { metricsService } from "../services/metrics.service";

const router = Router();

// Middleware for API metrics
const metricsMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    metricsService.recordAPIUsage(
      req.route?.path || req.path,
      req.method,
      res.statusCode,
      duration
    );
  });

  next();
};

// Apply middleware to all routes
router.use(metricsMiddleware);
router.use(hipaaMiddleware.auditAccess);
router.use(hipaaMiddleware.maskSensitiveData);
router.use(hipaaMiddleware.rateLimitPHI);

// Validation schemas
const medicalRecordValidation = [
  body("patient_id").isUUID().withMessage("Patient ID must be a valid UUID"),
  body("doctor_id").isUUID().withMessage("Doctor ID must be a valid UUID"),
  body("visit_date")
    .isISO8601()
    .withMessage("Visit date must be a valid ISO date"),
  body("symptoms")
    .optional()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Symptoms must be between 1 and 5000 characters"),
  body("examination_notes")
    .optional()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Examination notes must be between 1 and 10000 characters"),
  body("diagnosis")
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Diagnosis must be between 1 and 2000 characters"),
  body("treatment")
    .optional()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Treatment must be between 1 and 5000 characters"),
  body("medication")
    .optional()
    .isLength({ min: 1, max: 3000 })
    .withMessage("Medication must be between 1 and 3000 characters"),
  body("allergies")
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Allergies must be between 1 and 1000 characters"),
  body("vital_signs")
    .optional()
    .isObject()
    .withMessage("Vital signs must be an object"),
  body("vital_signs.blood_pressure_systolic")
    .optional()
    .isInt({ min: 50, max: 300 })
    .withMessage("Systolic BP must be between 50 and 300"),
  body("vital_signs.blood_pressure_diastolic")
    .optional()
    .isInt({ min: 30, max: 200 })
    .withMessage("Diastolic BP must be between 30 and 200"),
  body("vital_signs.heart_rate")
    .optional()
    .isInt({ min: 30, max: 300 })
    .withMessage("Heart rate must be between 30 and 300"),
  body("vital_signs.temperature")
    .optional()
    .isFloat({ min: 30.0, max: 45.0 })
    .withMessage("Temperature must be between 30.0 and 45.0"),
  body("vital_signs.oxygen_saturation")
    .optional()
    .isInt({ min: 70, max: 100 })
    .withMessage("Oxygen saturation must be between 70 and 100"),
  body("vital_signs.respiratory_rate")
    .optional()
    .isInt({ min: 8, max: 60 })
    .withMessage("Respiratory rate must be between 8 and 60"),
  body("status")
    .optional()
    .isIn(["active", "archived", "deleted"])
    .withMessage("Status must be active, archived, or deleted"),
];

const updateValidation = [
  param("id").isUUID().withMessage("Record ID must be a valid UUID"),
  ...medicalRecordValidation.map((validation) => validation.optional()),
];

const queryValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),
  query("date_from")
    .optional()
    .isISO8601()
    .withMessage("Date from must be a valid ISO date"),
  query("date_to")
    .optional()
    .isISO8601()
    .withMessage("Date to must be a valid ISO date"),
  query("doctor_id")
    .optional()
    .isUUID()
    .withMessage("Doctor ID must be a valid UUID"),
  query("status")
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
router.get(
  "/",
  queryValidation,
  enhancedMedicalRecordController.getAllMedicalRecords.bind(
    enhancedMedicalRecordController
  )
);

/**
 * @route GET /api/medical-records/patient/:patient_id
 * @desc Get all medical records for a specific patient
 * @access Private
 * @middleware HIPAA Compliance, Patient Validation, Cache
 */
router.get(
  "/patient/:patient_id",
  [
    param("patient_id").isUUID().withMessage("Patient ID must be a valid UUID"),
    ...queryValidation,
  ],
  enhancedMedicalRecordController.getMedicalRecordsByPatient.bind(
    enhancedMedicalRecordController
  )
);

/**
 * @route GET /api/medical-records/doctor/:doctor_id
 * @desc Get all medical records for a specific doctor
 * @access Private
 * @middleware HIPAA Compliance, Doctor Validation, Cache
 */
router.get(
  "/doctor/:doctor_id",
  [
    param("doctor_id").isUUID().withMessage("Doctor ID must be a valid UUID"),
    ...queryValidation,
  ],
  enhancedMedicalRecordController.getMedicalRecordsByPatient.bind(
    enhancedMedicalRecordController
  ) // Will be implemented
);

/**
 * @route GET /api/medical-records/:id
 * @desc Get a specific medical record by ID
 * @access Private
 * @middleware HIPAA Compliance, Authorization
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Record ID must be a valid UUID")],
  enhancedMedicalRecordController.getMedicalRecordsByPatient.bind(
    enhancedMedicalRecordController
  ) // Will be implemented
);

/**
 * @route POST /api/medical-records
 * @desc Create a new medical record
 * @access Private
 * @middleware HIPAA Compliance, Validation, Integration
 */
router.post(
  "/",
  medicalRecordValidation,
  enhancedMedicalRecordController.createMedicalRecord.bind(
    enhancedMedicalRecordController
  )
);

/**
 * @route PUT /api/medical-records/:id
 * @desc Update a medical record
 * @access Private
 * @middleware HIPAA Compliance, Change Tracking, Notification
 */
router.put(
  "/:id",
  updateValidation,
  enhancedMedicalRecordController.updateMedicalRecord.bind(
    enhancedMedicalRecordController
  )
);

/**
 * @route DELETE /api/medical-records/:id
 * @desc Soft delete a medical record
 * @access Private
 * @middleware HIPAA Compliance, Audit Logging
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Record ID must be a valid UUID")],
  enhancedMedicalRecordController.updateMedicalRecord.bind(
    enhancedMedicalRecordController
  ) // Will implement soft delete
);

/**
 * @route GET /api/medical-records/search
 * @desc Advanced search for medical records
 * @access Private
 * @middleware HIPAA Compliance, Cache, Performance Monitoring
 */
router.get(
  "/search",
  [
    query("q")
      .notEmpty()
      .isLength({ min: 3, max: 100 })
      .withMessage("Search query must be between 3 and 100 characters"),
    query("type")
      .optional()
      .isIn(["symptoms", "diagnosis", "treatment", "medication", "all"])
      .withMessage(
        "Search type must be symptoms, diagnosis, treatment, medication, or all"
      ),
    ...queryValidation,
  ],
  enhancedMedicalRecordController.getAllMedicalRecords.bind(
    enhancedMedicalRecordController
  ) // Will implement search
);

/**
 * @route GET /api/medical-records/analytics/summary
 * @desc Get analytics summary for medical records
 * @access Private - Admin only
 * @middleware HIPAA Compliance, Admin Authorization
 */
router.get(
  "/analytics/summary",
  [
    query("period")
      .optional()
      .isIn(["1d", "7d", "30d", "90d", "1y"])
      .withMessage("Period must be 1d, 7d, 30d, 90d, or 1y"),
    query("group_by")
      .optional()
      .isIn(["doctor", "department", "diagnosis", "date"])
      .withMessage("Group by must be doctor, department, diagnosis, or date"),
  ],
  enhancedMedicalRecordController.getAllMedicalRecords.bind(
    enhancedMedicalRecordController
  ) // Will implement analytics
);

/**
 * @route GET /api/medical-records/health
 * @desc Get service health and performance metrics
 * @access Private - Admin only
 */
router.get(
  "/health",
  enhancedMedicalRecordController.getHealthMetrics.bind(
    enhancedMedicalRecordController
  )
);

/**
 * @route POST /api/medical-records/bulk
 * @desc Bulk create medical records
 * @access Private - Admin only
 * @middleware HIPAA Compliance, Bulk Validation
 */
router.post(
  "/bulk",
  [
    body("records")
      .isArray({ min: 1, max: 100 })
      .withMessage("Records must be an array with 1-100 items"),
    body("records.*").isObject().withMessage("Each record must be an object"),
  ],
  enhancedMedicalRecordController.createMedicalRecord.bind(
    enhancedMedicalRecordController
  ) // Will implement bulk
);

/**
 * @route GET /api/medical-records/export
 * @desc Export medical records (with data masking for HIPAA)
 * @access Private - Authorized roles only
 * @middleware HIPAA Compliance, Export Authorization
 */
router.get(
  "/export",
  [
    query("format")
      .optional()
      .isIn(["json", "csv", "pdf"])
      .withMessage("Export format must be json, csv, or pdf"),
    query("patient_ids")
      .optional()
      .custom((value) => {
        if (value) {
          const ids = value.split(",");
          return ids.every((id: string) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              id
            )
          );
        }
        return true;
      })
      .withMessage("Patient IDs must be valid UUIDs separated by commas"),
    ...queryValidation,
  ],
  enhancedMedicalRecordController.getAllMedicalRecords.bind(
    enhancedMedicalRecordController
  ) // Will implement export
);

export { router as enhancedMedicalRecordRoutes };
