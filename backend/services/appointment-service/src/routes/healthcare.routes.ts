import { Router } from "express";
import { HealthcareController } from "../controllers/healthcare.controller";
// import { authMiddleware } from '@hospital/shared/dist/middleware/auth.middleware'; // Commented out - not available

const router = Router();
const healthcareController = new HealthcareController();

// FHIR Routes
router.get(
  "/fhir/:appointmentId",
  // authMiddleware, // Commented out - not available
  healthcareController.getFHIRAppointment.bind(healthcareController)
);

// Diagnosis Routes
router.post(
  "/:appointmentId/diagnosis",
  // authMiddleware, // Commented out - not available
  healthcareController.addDiagnosis.bind(healthcareController)
);

// ICD-10 Routes
router.get(
  "/icd10",
  // authMiddleware, // Commented out - not available
  healthcareController.getICD10Codes.bind(healthcareController)
);

export default router;
