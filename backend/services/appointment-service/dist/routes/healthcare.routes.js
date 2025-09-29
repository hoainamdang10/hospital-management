"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthcare_controller_1 = require("../controllers/healthcare.controller");
const router = (0, express_1.Router)();
const healthcareController = new healthcare_controller_1.HealthcareController();
router.get("/fhir/:appointmentId", healthcareController.getFHIRAppointment.bind(healthcareController));
router.post("/:appointmentId/diagnosis", healthcareController.addDiagnosis.bind(healthcareController));
router.get("/icd10", healthcareController.getICD10Codes.bind(healthcareController));
exports.default = router;
//# sourceMappingURL=healthcare.routes.js.map