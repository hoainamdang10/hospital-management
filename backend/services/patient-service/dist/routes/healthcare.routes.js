"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const healthcare_controller_1 = require("../controllers/healthcare.controller");
const router = express_1.default.Router();
const patientHealthcareController = new healthcare_controller_1.PatientHealthcareController();
const validatePatientId = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage("Patient ID is required")
        .isUUID()
        .withMessage("Patient ID must be a valid UUID"),
];
const validateCategory = [
    (0, express_validator_1.param)("category")
        .notEmpty()
        .withMessage("Category is required")
        .isLength({ min: 1, max: 10 })
        .withMessage("Category must be 1-10 characters")
        .matches(/^[A-Z]\d*$/)
        .withMessage("Category must be valid ICD-10 category format (e.g., I, E11)"),
];
const validateTimelineQuery = [
    (0, express_validator_1.query)("start_date")
        .optional()
        .isISO8601()
        .withMessage("Start date must be a valid ISO 8601 date"),
    (0, express_validator_1.query)("end_date")
        .optional()
        .isISO8601()
        .withMessage("End date must be a valid ISO 8601 date"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
];
const validateMedicalHistoryQuery = [
    (0, express_validator_1.query)("include_resolved")
        .optional()
        .isIn(["true", "false"])
        .withMessage("Include resolved must be true or false"),
];
router.post("/:id/fhir/validate", (req, res) => patientHealthcareController.validatePatientFHIR(req, res));
router.get("/:id/fhir", (req, res) => patientHealthcareController.getPatientFHIR(req, res));
router.get("/:id/medical-history", (req, res) => patientHealthcareController.getPatientMedicalHistory(req, res));
router.get("/:id/diagnoses/category/:category", (req, res) => patientHealthcareController.getDiagnosesByCategory(req, res));
router.get("/:id/healthcare/timeline", (req, res) => patientHealthcareController.getHealthcareTimeline(req, res));
router.get("/:id/healthcare/compliance", (req, res) => patientHealthcareController.getHealthcareCompliance(req, res));
router.get("/:id/health-summary", (req, res) => patientHealthcareController.getHealthSummary(req, res));
router.get("/:id/healthcare/stats", (req, res) => {
    res.json({
        success: true,
        message: "Patient healthcare statistics endpoint - Coming in Phase 2",
        data: {
            feature_status: "PLANNED",
            implementation_phase: "Phase 2: Frontend Integration",
        },
    });
});
router.get("/healthcare/bulk-compliance", (0, express_validator_1.query)("patient_ids")
    .notEmpty()
    .withMessage("Patient IDs are required")
    .custom((value) => {
    const ids = value.split(",");
    if (ids.length > 50) {
        throw new Error("Maximum 50 patient IDs allowed");
    }
    ids.forEach((id) => {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim())) {
            throw new Error(`Invalid UUID format: ${id}`);
        }
    });
    return true;
}), (req, res) => {
    res.json({
        success: true,
        message: "Bulk compliance check endpoint - Coming in Phase 2",
        data: {
            feature_status: "PLANNED",
            implementation_phase: "Phase 2: Frontend Integration",
            max_patients: 50,
        },
    });
});
router.get("/:id/healthcare/export", validatePatientId, (0, express_validator_1.query)("format")
    .optional()
    .isIn(["json", "xml"])
    .withMessage("Format must be json or xml"), (0, express_validator_1.query)("include")
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
        const invalidIncludes = includes.filter((inc) => !validIncludes.includes(inc.trim()));
        if (invalidIncludes.length > 0) {
            throw new Error(`Invalid include values: ${invalidIncludes.join(", ")}`);
        }
    }
    return true;
}), (req, res) => {
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
});
exports.default = router;
//# sourceMappingURL=healthcare.routes.js.map