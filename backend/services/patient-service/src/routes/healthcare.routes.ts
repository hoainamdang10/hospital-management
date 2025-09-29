// ============================================================================
// PATIENT HEALTHCARE ROUTES - FHIR & Medical Records Integration
// Healthcare standards API routes for patients
// ============================================================================

import express, { Request, Response } from "express";
import { param, query } from "express-validator";
import { PatientHealthcareController } from "../controllers/healthcare.controller";
// Note: Patient service might have different auth middleware structure
// import { authMiddleware, requirePatient } from '../middleware/auth.middleware';

const router = express.Router();
const patientHealthcareController = new PatientHealthcareController();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const validatePatientId = [
  param("id")
    .notEmpty()
    .withMessage("Patient ID is required")
    .isUUID()
    .withMessage("Patient ID must be a valid UUID"),
];

const validateCategory = [
  param("category")
    .notEmpty()
    .withMessage("Category is required")
    .isLength({ min: 1, max: 10 })
    .withMessage("Category must be 1-10 characters")
    .matches(/^[A-Z]\d*$/)
    .withMessage(
      "Category must be valid ICD-10 category format (e.g., I, E11)"
    ),
];

const validateTimelineQuery = [
  query("start_date")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("end_date")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

const validateMedicalHistoryQuery = [
  query("include_resolved")
    .optional()
    .isIn(["true", "false"])
    .withMessage("Include resolved must be true or false"),
];

// ============================================================================
// FHIR PATIENT ROUTES
// ============================================================================

/**
 * @route   POST /api/patients/:id/fhir/validate
 * @desc    Validate patient data against FHIR Patient resource
 * @access  Private (Patient or Doctor)
 */
router.post(
  "/:id/fhir/validate",
  // authMiddleware, // Uncomment when auth middleware is available
  (req: Request, res: Response) =>
    patientHealthcareController.validatePatientFHIR(req, res)
);

/**
 * @route   GET /api/patients/:id/fhir
 * @desc    Get patient as FHIR Patient resource
 * @access  Private (Patient or Doctor)
 */
router.get(
  "/:id/fhir",
  // authMiddleware, // Uncomment when auth middleware is available
  (req: Request, res: Response) =>
    patientHealthcareController.getPatientFHIR(req, res)
);

// ============================================================================
// MEDICAL RECORDS ROUTES
// ============================================================================

/**
 * @route   GET /api/patients/:id/medical-history
 * @desc    Get patient medical history with diagnoses
 * @access  Private (Patient or Doctor)
 */
router.get(
  "/:id/medical-history",
  // authMiddleware, // Uncomment when auth middleware is available
  (req: Request, res: Response) =>
    patientHealthcareController.getPatientMedicalHistory(req, res)
);

/**
 * @route   GET /api/patients/:id/diagnoses/category/:category
 * @desc    Get patient diagnoses by ICD-10 category
 * @access  Private (Patient or Doctor)
 */
router.get(
  "/:id/diagnoses/category/:category",
  // authMiddleware, // Uncomment when auth middleware is available
  (req: Request, res: Response) =>
    patientHealthcareController.getDiagnosesByCategory(req, res)
);

/**
 * @route   GET /api/patients/:id/healthcare/timeline
 * @desc    Get patient healthcare timeline
 * @access  Private (Patient or Doctor)
 */
router.get(
  "/:id/healthcare/timeline",
  // authMiddleware, // Uncomment when auth middleware is available
  (req: Request, res: Response) =>
    patientHealthcareController.getHealthcareTimeline(req, res)
);

// ============================================================================
// HEALTHCARE COMPLIANCE ROUTES
// ============================================================================

/**
 * @route   GET /api/patients/:id/healthcare/compliance
 * @desc    Get healthcare compliance status for patient
 * @access  Private (Patient or Doctor)
 */
router.get(
  "/:id/healthcare/compliance",
  // authMiddleware, // Uncomment when auth middleware is available
  (req: Request, res: Response) =>
    patientHealthcareController.getHealthcareCompliance(req, res)
);

// ============================================================================
// PATIENT HEALTH SUMMARY ROUTES
// ============================================================================

/**
 * @route   GET /api/patients/:id/health-summary
 * @desc    Get patient health summary
 * @access  Private (Patient or Doctor)
 */
router.get(
  "/:id/health-summary",
  // authMiddleware, // Uncomment when auth middleware is available
  (req: Request, res: Response) =>
    patientHealthcareController.getHealthSummary(req, res)
);

// ============================================================================
// HEALTHCARE STATISTICS ROUTES (Future Enhancement)
// ============================================================================

/**
 * @route   GET /api/patients/:id/healthcare/stats
 * @desc    Get healthcare statistics for patient (diagnosis trends, compliance, etc.)
 * @access  Private (Patient or Doctor)
 * @note    This will be implemented in Phase 2
 */
router.get(
  "/:id/healthcare/stats",
  // authMiddleware, // Uncomment when auth middleware is available
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "Patient healthcare statistics endpoint - Coming in Phase 2",
      data: {
        feature_status: "PLANNED",
        implementation_phase: "Phase 2: Frontend Integration",
      },
    });
  }
);

/**
 * @route   GET /api/patients/healthcare/bulk-compliance
 * @desc    Get bulk healthcare compliance status for multiple patients
 * @access  Private (Admin or Doctor)
 * @note    This will be implemented in Phase 2
 */
router.get(
  "/healthcare/bulk-compliance",
  // authMiddleware, // Uncomment when auth middleware is available
  // requireDoctor, // Uncomment when auth middleware is available
  query("patient_ids")
    .notEmpty()
    .withMessage("Patient IDs are required")
    .custom((value) => {
      const ids = value.split(",");
      if (ids.length > 50) {
        throw new Error("Maximum 50 patient IDs allowed");
      }
      ids.forEach((id: string) => {
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            id.trim()
          )
        ) {
          throw new Error(`Invalid UUID format: ${id}`);
        }
      });
      return true;
    }),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "Bulk compliance check endpoint - Coming in Phase 2",
      data: {
        feature_status: "PLANNED",
        implementation_phase: "Phase 2: Frontend Integration",
        max_patients: 50,
      },
    });
  }
);

// ============================================================================
// HEALTHCARE EXPORT ROUTES (Future Enhancement)
// ============================================================================

/**
 * @route   GET /api/patients/:id/healthcare/export
 * @desc    Export patient healthcare data in FHIR format
 * @access  Private (Patient or Doctor)
 * @note    This will be implemented in Phase 2
 */
router.get(
  "/:id/healthcare/export",
  // authMiddleware, // Uncomment when auth middleware is available
  validatePatientId,
  query("format")
    .optional()
    .isIn(["json", "xml"])
    .withMessage("Format must be json or xml"),
  query("include")
    .optional()
    .custom((value) => {
      if (value) {
        const validIncludes = [
          "diagnoses",
          "appointments",
          "medications",
          "allergies",
        ];
        const includes = value.split(",");
        const invalidIncludes = includes.filter(
          (inc: string) => !validIncludes.includes(inc.trim())
        );
        if (invalidIncludes.length > 0) {
          throw new Error(
            `Invalid include values: ${invalidIncludes.join(", ")}`
          );
        }
      }
      return true;
    }),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "Healthcare data export endpoint - Coming in Phase 2",
      data: {
        feature_status: "PLANNED",
        implementation_phase: "Phase 2: Frontend Integration",
        supported_formats: ["json", "xml"],
        supported_includes: [
          "diagnoses",
          "appointments",
          "medications",
          "allergies",
        ],
      },
    });
  }
);

export default router;
