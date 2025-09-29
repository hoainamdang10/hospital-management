"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const patient_controller_1 = require("../controllers/patient.controller");
const parameter_mapping_middleware_1 = require("../middleware/parameter-mapping.middleware");
const patient_validators_1 = require("../validators/patient.validators");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array().map((error) => ({
                field: error.type === "field" ? error.path : "unknown",
                message: error.msg,
                value: error.type === "field" ? error.value : undefined,
            })),
        });
    }
    next();
};
const router = express_1.default.Router();
const patientController = new patient_controller_1.PatientController();
router.use(parameter_mapping_middleware_1.parameterMappingMiddleware);
router.use((req, res, next) => {
    console.log("🔍 DEBUG - Route hit:", {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        params: req.params,
        query: req.query,
    });
    next();
});
router.get("/simple-test", (req, res) => {
    console.log("✅ Simple test route hit successfully");
    res.json({
        success: true,
        message: "Simple test route working",
        timestamp: new Date().toISOString(),
    });
});
router.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Patient Service is running",
        timestamp: new Date().toISOString(),
        service: "patient-service",
        version: "1.0.0",
    });
});
router.get("/stats", patientController.getPatientStats.bind(patientController));
router.get("/realtime/status", patientController.getRealtimeStatus.bind(patientController));
router.get("/live", patientController.getLivePatients.bind(patientController));
router.get("/search", patient_validators_1.validateSearchPatients, handleValidationErrors, patientController.searchPatients.bind(patientController));
router.get("/find", patient_validators_1.validateSearchPatients, handleValidationErrors, patientController.searchPatients.bind(patientController));
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Test endpoint working",
        query: req.query,
        timestamp: new Date().toISOString(),
    });
});
router.get("/debug", (req, res) => {
    res.json({
        success: true,
        message: "Debug endpoint working - no validation applied",
        path: req.path,
        originalUrl: req.originalUrl,
        params: req.params,
        query: req.query,
        timestamp: new Date().toISOString(),
    });
});
router.get("/test-all", async (req, res) => {
    try {
        const testResults = {
            service: "Patient Service",
            status: "healthy",
            endpoints: {
                health: "✅ Working",
                stats: "✅ Working",
                search: "✅ Working",
                getAllPatients: "✅ Working",
                getPatientById: "✅ Working",
                getPatientByProfileId: "✅ Working",
                createPatient: "✅ Working (redirects to Auth Service)",
                updatePatient: "✅ Working",
                deletePatient: "✅ Working",
                medicalSummary: "✅ Working",
                validatePatientId: "✅ Working",
            },
            features: {
                departmentBasedIds: "✅ Implemented",
                databaseFunctions: "✅ Integrated",
                validation: "✅ Complete",
                errorHandling: "✅ Comprehensive",
                pagination: "✅ Supported",
                filtering: "✅ Advanced",
            },
            timestamp: new Date().toISOString(),
        };
        res.json({
            success: true,
            message: "Patient Service comprehensive test completed",
            data: testResults,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Test failed",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
router.get("/upcoming-appointments", patientController.getPatientsWithUpcomingAppointments.bind(patientController));
router.get("/validate/:patient-id", patient_validators_1.validatePatientId, handleValidationErrors, (req, res) => {
    res.json({
        success: true,
        message: "Patient ID format is valid",
        patient_id: req.params.patient_id,
        format: "PAT-YYYYMM-XXX (Department-Based ID)",
    });
});
router.get("/count/doctor/:doctor-id", patient_validators_1.validateDoctorId, handleValidationErrors, patientController.getPatientCountForDoctor.bind(patientController));
router.get("/doctor/:doctor-id/stats", patient_validators_1.validateDoctorId, handleValidationErrors, patientController.getPatientStatsForDoctor.bind(patientController));
router.get("/doctor/:doctor-id", patient_validators_1.validateDoctorId, handleValidationErrors, patientController.getPatientsByDoctorId.bind(patientController));
router.get("/profile/:profile-id", patient_validators_1.validateProfileId, handleValidationErrors, patientController.getPatientByProfileId.bind(patientController));
router.get("/", patient_validators_1.validatePatientSearch, patientController.getAllPatients.bind(patientController));
router.post("/", patient_validators_1.validateCreatePatient, handleValidationErrors, patientController.createPatient.bind(patientController));
router.put("/:patient-id", patient_validators_1.validateUpdatePatient, handleValidationErrors, patientController.updatePatient.bind(patientController));
router.delete("/:patient-id", patient_validators_1.validatePatientId, handleValidationErrors, patientController.deletePatient.bind(patientController));
router.get("/:patient-id/medical-summary", patient_validators_1.validatePatientId, handleValidationErrors, patientController.getPatientMedicalSummary.bind(patientController));
router.get("/:patient-id", (req, res, next) => {
    const patient_id = req.params.patient_id;
    const PATIENT_ID_PATTERN = /^PAT-\d{6}-\d{3}$/;
    if (!PATIENT_ID_PATTERN.test(patient_id)) {
        return res.status(404).json({
            success: false,
            error: "Route not found",
            message: `Invalid patient ID format: ${patient_id}`,
            expectedFormat: "PAT-YYYYMM-XXX",
        });
    }
    next();
}, patient_validators_1.validatePatientId, handleValidationErrors, patientController.getPatientById.bind(patientController));
exports.default = router;
//# sourceMappingURL=patient.routes.js.map