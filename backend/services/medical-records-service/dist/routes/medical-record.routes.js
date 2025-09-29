"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const medical_record_controller_1 = require("../controllers/medical-record.controller");
const router = (0, express_1.Router)();
const medicalRecordController = new medical_record_controller_1.MedicalRecordController();
// Validation middleware
const validateCreateMedicalRecord = [
    (0, express_validator_1.body)("patient_id").notEmpty().withMessage("Patient ID is required"),
    (0, express_validator_1.body)("doctor_id").notEmpty().withMessage("Doctor ID is required"),
    (0, express_validator_1.body)("visit_date").isISO8601().withMessage("Valid visit date is required"),
    (0, express_validator_1.body)("chief_complaint").optional().isString(),
    (0, express_validator_1.body)("present_illness").optional().isString(),
    (0, express_validator_1.body)("past_medical_history").optional().isString(),
    (0, express_validator_1.body)("physical_examination").optional().isString(),
    (0, express_validator_1.body)("diagnosis").optional().isString(),
    (0, express_validator_1.body)("treatment_plan").optional().isString(),
    (0, express_validator_1.body)("medications").optional().isString(),
    (0, express_validator_1.body)("follow_up_instructions").optional().isString(),
    (0, express_validator_1.body)("notes").optional().isString(),
];
const validateUpdateMedicalRecord = [
    (0, express_validator_1.body)("chief_complaint").optional().isString(),
    (0, express_validator_1.body)("present_illness").optional().isString(),
    (0, express_validator_1.body)("past_medical_history").optional().isString(),
    (0, express_validator_1.body)("physical_examination").optional().isString(),
    (0, express_validator_1.body)("diagnosis").optional().isString(),
    (0, express_validator_1.body)("treatment_plan").optional().isString(),
    (0, express_validator_1.body)("medications").optional().isString(),
    (0, express_validator_1.body)("follow_up_instructions").optional().isString(),
    (0, express_validator_1.body)("notes").optional().isString(),
    (0, express_validator_1.body)("status").optional().isIn(["active", "archived", "deleted"]),
];
const validateCreateLabResult = [
    (0, express_validator_1.body)("test_name").notEmpty().withMessage("Test name is required"),
    (0, express_validator_1.body)("test_type").notEmpty().withMessage("Test type is required"),
    (0, express_validator_1.body)("test_date").isISO8601().withMessage("Valid test date is required"),
    (0, express_validator_1.body)("result_value").optional().isString(),
    (0, express_validator_1.body)("reference_range").optional().isString(),
    (0, express_validator_1.body)("unit").optional().isString(),
    (0, express_validator_1.body)("result_date").optional().isISO8601(),
    (0, express_validator_1.body)("lab_technician").optional().isString(),
    (0, express_validator_1.body)("notes").optional().isString(),
];
const validateCreateVitalSigns = [
    (0, express_validator_1.body)("record_id").notEmpty().withMessage("Record ID is required"),
    (0, express_validator_1.body)("recorded_at")
        .isISO8601()
        .withMessage("Valid recorded date is required"),
    (0, express_validator_1.body)("temperature").optional().isNumeric(),
    (0, express_validator_1.body)("vital_signs.blood_pressure_systolic")
        .optional()
        .isInt({ min: 0, max: 300 }),
    (0, express_validator_1.body)("vital_signs.blood_pressure_diastolic")
        .optional()
        .isInt({ min: 0, max: 200 }),
    (0, express_validator_1.body)("heart_rate").optional().isInt({ min: 0, max: 300 }),
    (0, express_validator_1.body)("respiratory_rate").optional().isInt({ min: 0, max: 100 }),
    (0, express_validator_1.body)("vital_signs.oxygen_saturation")
        .optional()
        .isFloat({ min: 0, max: 100 }),
    (0, express_validator_1.body)("weight").optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)("height").optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)("notes").optional().isString(),
];
const validateRecordId = [
    (0, express_validator_1.param)("recordId").notEmpty().withMessage("Record ID is required"),
];
// ============================================
// PRESCRIPTION VALIDATION (Merged from Prescription Service)
// ============================================
const validateCreatePrescription = [
    (0, express_validator_1.param)("recordId").notEmpty().withMessage("Record ID is required"),
    (0, express_validator_1.body)("prescription_date")
        .isISO8601()
        .withMessage("Valid prescription date is required"),
    (0, express_validator_1.body)("medications")
        .isArray({ min: 1 })
        .withMessage("At least one medication is required"),
    (0, express_validator_1.body)("medications.*.medication_name")
        .notEmpty()
        .withMessage("Medication name is required"),
    (0, express_validator_1.body)("medications.*.dosage").notEmpty().withMessage("Dosage is required"),
    (0, express_validator_1.body)("medications.*.instructions")
        .notEmpty()
        .withMessage("Instructions are required"),
    (0, express_validator_1.body)("medications.*.quantity")
        .isInt({ min: 1 })
        .withMessage("Quantity must be a positive integer"),
    (0, express_validator_1.body)("medications.*.cost_per_unit")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Cost per unit must be a positive number"),
];
const validateUpdatePrescription = [
    (0, express_validator_1.param)("recordId").notEmpty().withMessage("Record ID is required"),
    (0, express_validator_1.param)("prescriptionId").notEmpty().withMessage("Prescription ID is required"),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(["active", "completed", "cancelled"])
        .withMessage("Invalid status"),
    (0, express_validator_1.body)("medications")
        .optional()
        .isArray()
        .withMessage("Medications must be an array"),
    (0, express_validator_1.body)("medications.*.medication_name")
        .optional()
        .notEmpty()
        .withMessage("Medication name is required"),
    (0, express_validator_1.body)("medications.*.dosage")
        .optional()
        .notEmpty()
        .withMessage("Dosage is required"),
    (0, express_validator_1.body)("medications.*.instructions")
        .optional()
        .notEmpty()
        .withMessage("Instructions are required"),
    (0, express_validator_1.body)("medications.*.quantity")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Quantity must be a positive integer"),
];
const validatePatientId = [
    (0, express_validator_1.param)("patientId").notEmpty().withMessage("Patient ID is required"),
];
const validateDoctorId = [
    (0, express_validator_1.param)("doctorId").notEmpty().withMessage("Doctor ID is required"),
];
// Medical Records routes
router.get("/", medicalRecordController.getAllMedicalRecords.bind(medicalRecordController));
router.get("/:recordId", validateRecordId, medicalRecordController.getMedicalRecordById.bind(medicalRecordController));
router.get("/patient/:patientId", validatePatientId, medicalRecordController.getMedicalRecordsByPatientId.bind(medicalRecordController));
router.get("/doctor/:doctorId", validateDoctorId, medicalRecordController.getMedicalRecordsByDoctorId.bind(medicalRecordController));
router.post("/", validateCreateMedicalRecord, medicalRecordController.createMedicalRecord.bind(medicalRecordController));
router.put("/:recordId", validateRecordId, validateUpdateMedicalRecord, medicalRecordController.updateMedicalRecord.bind(medicalRecordController));
router.delete("/:recordId", validateRecordId, medicalRecordController.deleteMedicalRecord.bind(medicalRecordController));
// =============================
// VITAL SIGNS ROUTES
// =============================
router.post("/:recordId/vitals", validateRecordId, validateCreateVitalSigns, medicalRecordController.addVitalSigns.bind(medicalRecordController));
router.get("/:recordId/vitals", validateRecordId, medicalRecordController.listVitalSigns.bind(medicalRecordController));
// =============================
// LAB RESULTS ROUTES
// =============================
router.post("/:recordId/lab_results", validateRecordId, validateCreateLabResult, medicalRecordController.createLabResult.bind(medicalRecordController));
router.put("/:recordId/lab_results/:resultId", validateRecordId, medicalRecordController.updateLabResult.bind(medicalRecordController));
router.get("/:recordId/lab_results", validateRecordId, medicalRecordController.listLabResultsByRecord.bind(medicalRecordController));
router.get("/patient/:patientId/lab_results", validatePatientId, medicalRecordController.listLabResultsByPatient.bind(medicalRecordController));
// =============================
// MEDICAL HISTORY ROUTE
// =============================
router.get("/patient/:patientId/history", validatePatientId, medicalRecordController.getPatientHistory.bind(medicalRecordController));
// REMOVED: Lab Results routes - lab results now stored as simple text in medical records
// REMOVED: Vital Signs routes - vital signs now embedded as BasicVitalSigns in medical records
// ============================================
// PRESCRIPTION ROUTES (Merged from Prescription Service)
// ============================================
// Prescription routes for medical records
router.post("/:recordId/prescriptions", validateCreatePrescription, medicalRecordController.createPrescriptionForRecord.bind(medicalRecordController));
router.put("/:recordId/prescriptions/:prescriptionId", validateUpdatePrescription, medicalRecordController.updatePrescriptionInRecord.bind(medicalRecordController));
// Query prescriptions by patient or doctor
router.get("/prescriptions/patient/:patientId", validatePatientId, medicalRecordController.getPrescriptionsByPatientId.bind(medicalRecordController));
router.get("/prescriptions/doctor/:doctorId", validateDoctorId, medicalRecordController.getPrescriptionsByDoctorId.bind(medicalRecordController));
exports.default = router;
//# sourceMappingURL=medical-record.routes.js.map