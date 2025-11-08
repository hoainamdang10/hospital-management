"use strict";
/**
 * Routes - Export Index
 * Central export point for all route creators
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const clinicalNoteRoutes_1 = require("./clinicalNoteRoutes");
const diagnosticReportRoutes_1 = require("./diagnosticReportRoutes");
const treatmentPlanRoutes_1 = require("./treatmentPlanRoutes");
const prescriptionRoutes_1 = require("./prescriptionRoutes");
const labResultRoutes_1 = require("./labResultRoutes");
const medicalImagingRoutes_1 = require("./medicalImagingRoutes");
const auditRoutes_1 = require("./auditRoutes");
const fhirRoutes_1 = require("./fhirRoutes");
const types_1 = require("../../infrastructure/di/types");
__exportStar(require("./clinicalNoteRoutes"), exports);
__exportStar(require("./diagnosticReportRoutes"), exports);
__exportStar(require("./treatmentPlanRoutes"), exports);
__exportStar(require("./prescriptionRoutes"), exports);
__exportStar(require("./labResultRoutes"), exports);
__exportStar(require("./medicalImagingRoutes"), exports);
__exportStar(require("./auditRoutes"), exports);
__exportStar(require("./fhirRoutes"), exports);
/**
 * Setup all routes for the application
 */
function setupRoutes(app, container) {
    // Get controllers from container
    const clinicalNoteController = container.get(types_1.TYPES.ClinicalNoteController);
    const diagnosticReportController = container.get(types_1.TYPES.DiagnosticReportController);
    const treatmentPlanController = container.get(types_1.TYPES.TreatmentPlanController);
    const prescriptionController = container.get(types_1.TYPES.PrescriptionController);
    const labResultController = container.get(types_1.TYPES.LabResultController);
    const medicalImagingController = container.get(types_1.TYPES.MedicalImagingController);
    const auditController = container.get(types_1.TYPES.AuditController);
    const fhirController = container.get(types_1.TYPES.FHIRController);
    // Mount routes - All routes use /api/v2/clinical-emr prefix for consistency
    // This ensures FHIR R4 compliance and allows independent evolution of clinical APIs
    app.use("/api/v2/clinical-emr/notes", (0, clinicalNoteRoutes_1.createClinicalNoteRoutes)(clinicalNoteController));
    app.use("/api/v2/clinical-emr/diagnostic-reports", (0, diagnosticReportRoutes_1.createDiagnosticReportRoutes)(diagnosticReportController));
    app.use("/api/v2/clinical-emr/treatment-plans", (0, treatmentPlanRoutes_1.createTreatmentPlanRoutes)(treatmentPlanController));
    app.use("/api/v2/clinical-emr/prescriptions", (0, prescriptionRoutes_1.createPrescriptionRoutes)(prescriptionController));
    app.use("/api/v2/clinical-emr/lab-results", (0, labResultRoutes_1.createLabResultRoutes)(labResultController));
    app.use("/api/v2/clinical-emr/medical-imaging", (0, medicalImagingRoutes_1.createMedicalImagingRoutes)(medicalImagingController));
    // HIPAA Compliance & FHIR R4 Routes
    app.use("/api/v2/clinical-emr", (0, auditRoutes_1.createAuditRoutes)(auditController));
    app.use("/api/v2/clinical-emr", (0, fhirRoutes_1.createFHIRRoutes)(fhirController));
}
//# sourceMappingURL=index.js.map