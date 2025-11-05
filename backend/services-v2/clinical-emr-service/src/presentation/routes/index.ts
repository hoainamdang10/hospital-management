/**
 * Routes - Export Index
 * Central export point for all route creators
 */

import { Express } from "express";
import { Container } from "inversify";
import { createClinicalNoteRoutes } from "./clinicalNoteRoutes";
import { createDiagnosticReportRoutes } from "./diagnosticReportRoutes";
import { createTreatmentPlanRoutes } from "./treatmentPlanRoutes";
import { createPrescriptionRoutes } from "./prescriptionRoutes";
import { createLabResultRoutes } from "./labResultRoutes";
import { createMedicalImagingRoutes } from "./medicalImagingRoutes";
import { createAuditRoutes } from "./auditRoutes";
import { createFHIRRoutes } from "./fhirRoutes";
import { ClinicalNoteController } from "../controllers/ClinicalNoteController";
import { DiagnosticReportController } from "../controllers/DiagnosticReportController";
import { TreatmentPlanController } from "../controllers/TreatmentPlanController";
import { PrescriptionController } from "../controllers/PrescriptionController";
import { LabResultController } from "../controllers/LabResultController";
import { MedicalImagingController } from "../controllers/MedicalImagingController";
import { AuditController } from "../controllers/AuditController";
import { FHIRController } from "../controllers/FHIRController";
import { TYPES } from "../../infrastructure/di/types";

export * from "./clinicalNoteRoutes";
export * from "./diagnosticReportRoutes";
export * from "./treatmentPlanRoutes";
export * from "./prescriptionRoutes";
export * from "./labResultRoutes";
export * from "./medicalImagingRoutes";
export * from "./auditRoutes";
export * from "./fhirRoutes";

/**
 * Setup all routes for the application
 */
export function setupRoutes(app: Express, container: Container): void {
  // Get controllers from container
  const clinicalNoteController = container.get<ClinicalNoteController>(
    TYPES.ClinicalNoteController,
  );
  const diagnosticReportController = container.get<DiagnosticReportController>(
    TYPES.DiagnosticReportController,
  );
  const treatmentPlanController = container.get<TreatmentPlanController>(
    TYPES.TreatmentPlanController,
  );
  const prescriptionController = container.get<PrescriptionController>(
    TYPES.PrescriptionController,
  );
  const labResultController = container.get<LabResultController>(
    TYPES.LabResultController,
  );
  const medicalImagingController = container.get<MedicalImagingController>(
    TYPES.MedicalImagingController,
  );
  const auditController = container.get<AuditController>(
    TYPES.AuditController,
  );
  const fhirController = container.get<FHIRController>(
    TYPES.FHIRController,
  );

  // Mount routes - All routes use /api/v2/clinical-emr prefix for consistency
  // This ensures FHIR R4 compliance and allows independent evolution of clinical APIs
  app.use(
    "/api/v2/clinical-emr/notes",
    createClinicalNoteRoutes(clinicalNoteController),
  );
  app.use(
    "/api/v2/clinical-emr/diagnostic-reports",
    createDiagnosticReportRoutes(diagnosticReportController),
  );
  app.use(
    "/api/v2/clinical-emr/treatment-plans",
    createTreatmentPlanRoutes(treatmentPlanController),
  );
  app.use(
    "/api/v2/clinical-emr/prescriptions",
    createPrescriptionRoutes(prescriptionController),
  );
  app.use(
    "/api/v2/clinical-emr/lab-results",
    createLabResultRoutes(labResultController),
  );
  app.use(
    "/api/v2/clinical-emr/medical-imaging",
    createMedicalImagingRoutes(medicalImagingController),
  );

  // HIPAA Compliance & FHIR R4 Routes
  app.use(
    "/api/v2/clinical-emr",
    createAuditRoutes(auditController),
  );
  app.use(
    "/api/v2/clinical-emr",
    createFHIRRoutes(fhirController),
  );
}
