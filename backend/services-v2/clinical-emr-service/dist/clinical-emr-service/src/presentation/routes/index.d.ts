/**
 * Routes - Export Index
 * Central export point for all route creators
 */
import { Application } from "express";
import { Container } from "inversify";
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
export declare function setupRoutes(app: Application, container: Container): void;
//# sourceMappingURL=index.d.ts.map