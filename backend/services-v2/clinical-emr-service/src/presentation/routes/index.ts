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
import { ClinicalNoteController } from "../controllers/ClinicalNoteController";
import { DiagnosticReportController } from "../controllers/DiagnosticReportController";
import { TreatmentPlanController } from "../controllers/TreatmentPlanController";
import { PrescriptionController } from "../controllers/PrescriptionController";
import { TYPES } from "../../infrastructure/di/types";

export * from "./clinicalNoteRoutes";
export * from "./diagnosticReportRoutes";
export * from "./treatmentPlanRoutes";
export * from "./prescriptionRoutes";

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

  // Mount routes
  app.use(
    "/api/clinical/notes",
    createClinicalNoteRoutes(clinicalNoteController),
  );
  app.use(
    "/api/clinical/diagnostic-reports",
    createDiagnosticReportRoutes(diagnosticReportController),
  );
  app.use(
    "/api/clinical/treatment-plans",
    createTreatmentPlanRoutes(treatmentPlanController),
  );
  app.use(
    "/api/clinical/prescriptions",
    createPrescriptionRoutes(prescriptionController),
  );
}
