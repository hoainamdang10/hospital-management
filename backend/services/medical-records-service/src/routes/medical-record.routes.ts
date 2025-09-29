import { Router } from "express";
import { body, param } from "express-validator";
import { MedicalRecordController } from "../controllers/medical-record.controller";

const router = Router();
const medicalRecordController = new MedicalRecordController();

// Validation middleware
const validateCreateMedicalRecord = [
  body("patient_id").notEmpty().withMessage("Patient ID is required"),
  body("doctor_id").notEmpty().withMessage("Doctor ID is required"),
  body("visit_date").isISO8601().withMessage("Valid visit date is required"),
  body("chief_complaint").optional().isString(),
  body("present_illness").optional().isString(),
  body("past_medical_history").optional().isString(),
  body("physical_examination").optional().isString(),
  body("diagnosis").optional().isString(),
  body("treatment_plan").optional().isString(),
  body("medications").optional().isString(),
  body("follow_up_instructions").optional().isString(),
  body("notes").optional().isString(),
];

const validateUpdateMedicalRecord = [
  body("chief_complaint").optional().isString(),
  body("present_illness").optional().isString(),
  body("past_medical_history").optional().isString(),
  body("physical_examination").optional().isString(),
  body("diagnosis").optional().isString(),
  body("treatment_plan").optional().isString(),
  body("medications").optional().isString(),
  body("follow_up_instructions").optional().isString(),
  body("notes").optional().isString(),
  body("status").optional().isIn(["active", "archived", "deleted"]),
];

const validateCreateLabResult = [
  body("test_name").notEmpty().withMessage("Test name is required"),
  body("test_type").notEmpty().withMessage("Test type is required"),
  body("test_date").isISO8601().withMessage("Valid test date is required"),
  body("result_value").optional().isString(),
  body("reference_range").optional().isString(),
  body("unit").optional().isString(),
  body("result_date").optional().isISO8601(),
  body("lab_technician").optional().isString(),
  body("notes").optional().isString(),
];

const validateCreateVitalSigns = [
  body("record_id").notEmpty().withMessage("Record ID is required"),
  body("recorded_at")
    .isISO8601()
    .withMessage("Valid recorded date is required"),
  body("temperature").optional().isNumeric(),
  body("vital_signs.blood_pressure_systolic")
    .optional()
    .isInt({ min: 0, max: 300 }),
  body("vital_signs.blood_pressure_diastolic")
    .optional()
    .isInt({ min: 0, max: 200 }),
  body("heart_rate").optional().isInt({ min: 0, max: 300 }),
  body("respiratory_rate").optional().isInt({ min: 0, max: 100 }),
  body("vital_signs.oxygen_saturation")
    .optional()
    .isFloat({ min: 0, max: 100 }),
  body("weight").optional().isFloat({ min: 0 }),
  body("height").optional().isFloat({ min: 0 }),
  body("notes").optional().isString(),
];

const validateRecordId = [
  param("recordId").notEmpty().withMessage("Record ID is required"),
];

// ============================================
// PRESCRIPTION VALIDATION (Merged from Prescription Service)
// ============================================

const validateCreatePrescription = [
  param("recordId").notEmpty().withMessage("Record ID is required"),
  body("prescription_date")
    .isISO8601()
    .withMessage("Valid prescription date is required"),
  body("medications")
    .isArray({ min: 1 })
    .withMessage("At least one medication is required"),
  body("medications.*.medication_name")
    .notEmpty()
    .withMessage("Medication name is required"),
  body("medications.*.dosage").notEmpty().withMessage("Dosage is required"),
  body("medications.*.instructions")
    .notEmpty()
    .withMessage("Instructions are required"),
  body("medications.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
  body("medications.*.cost_per_unit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost per unit must be a positive number"),
];

const validateUpdatePrescription = [
  param("recordId").notEmpty().withMessage("Record ID is required"),
  param("prescriptionId").notEmpty().withMessage("Prescription ID is required"),
  body("status")
    .optional()
    .isIn(["active", "completed", "cancelled"])
    .withMessage("Invalid status"),
  body("medications")
    .optional()
    .isArray()
    .withMessage("Medications must be an array"),
  body("medications.*.medication_name")
    .optional()
    .notEmpty()
    .withMessage("Medication name is required"),
  body("medications.*.dosage")
    .optional()
    .notEmpty()
    .withMessage("Dosage is required"),
  body("medications.*.instructions")
    .optional()
    .notEmpty()
    .withMessage("Instructions are required"),
  body("medications.*.quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
];

const validatePatientId = [
  param("patientId").notEmpty().withMessage("Patient ID is required"),
];

const validateDoctorId = [
  param("doctorId").notEmpty().withMessage("Doctor ID is required"),
];

// Medical Records routes
router.get(
  "/",
  medicalRecordController.getAllMedicalRecords.bind(medicalRecordController)
);
router.get(
  "/:recordId",
  validateRecordId,
  medicalRecordController.getMedicalRecordById.bind(medicalRecordController)
);
router.get(
  "/patient/:patientId",
  validatePatientId,
  medicalRecordController.getMedicalRecordsByPatientId.bind(
    medicalRecordController
  )
);
router.get(
  "/doctor/:doctorId",
  validateDoctorId,
  medicalRecordController.getMedicalRecordsByDoctorId.bind(
    medicalRecordController
  )
);
router.post(
  "/",
  validateCreateMedicalRecord,
  medicalRecordController.createMedicalRecord.bind(medicalRecordController)
);
router.put(
  "/:recordId",
  validateRecordId,
  validateUpdateMedicalRecord,
  medicalRecordController.updateMedicalRecord.bind(medicalRecordController)
);
router.delete(
  "/:recordId",
  validateRecordId,
  medicalRecordController.deleteMedicalRecord.bind(medicalRecordController)
);

// =============================
// VITAL SIGNS ROUTES
// =============================
router.post(
  "/:recordId/vitals",
  validateRecordId,
  validateCreateVitalSigns,
  medicalRecordController.addVitalSigns.bind(medicalRecordController)
);

router.get(
  "/:recordId/vitals",
  validateRecordId,
  medicalRecordController.listVitalSigns.bind(medicalRecordController)
);

// =============================
// LAB RESULTS ROUTES
// =============================
router.post(
  "/:recordId/lab_results",
  validateRecordId,
  validateCreateLabResult,
  medicalRecordController.createLabResult.bind(medicalRecordController)
);

router.put(
  "/:recordId/lab_results/:resultId",
  validateRecordId,
  medicalRecordController.updateLabResult.bind(medicalRecordController)
);

router.get(
  "/:recordId/lab_results",
  validateRecordId,
  medicalRecordController.listLabResultsByRecord.bind(medicalRecordController)
);

router.get(
  "/patient/:patientId/lab_results",
  validatePatientId,
  medicalRecordController.listLabResultsByPatient.bind(medicalRecordController)
);

// =============================
// MEDICAL HISTORY ROUTE
// =============================
router.get(
  "/patient/:patientId/history",
  validatePatientId,
  medicalRecordController.getPatientHistory.bind(medicalRecordController)
);

// REMOVED: Lab Results routes - lab results now stored as simple text in medical records
// REMOVED: Vital Signs routes - vital signs now embedded as BasicVitalSigns in medical records

// ============================================
// PRESCRIPTION ROUTES (Merged from Prescription Service)
// ============================================

// Prescription routes for medical records
router.post(
  "/:recordId/prescriptions",
  validateCreatePrescription,
  medicalRecordController.createPrescriptionForRecord.bind(
    medicalRecordController
  )
);

router.put(
  "/:recordId/prescriptions/:prescriptionId",
  validateUpdatePrescription,
  medicalRecordController.updatePrescriptionInRecord.bind(
    medicalRecordController
  )
);

// Query prescriptions by patient or doctor
router.get(
  "/prescriptions/patient/:patientId",
  validatePatientId,
  medicalRecordController.getPrescriptionsByPatientId.bind(
    medicalRecordController
  )
);

router.get(
  "/prescriptions/doctor/:doctorId",
  validateDoctorId,
  medicalRecordController.getPrescriptionsByDoctorId.bind(
    medicalRecordController
  )
);

export default router;
