/**
 * Routes - Export Index
 * Central export point for all route creators
 */

import { Express } from 'express';
import { DIContainer } from '@shared/infrastructure/di/container';
import { createClinicalNoteRoutes } from './clinicalNoteRoutes';
import { createDiagnosticReportRoutes } from './diagnosticReportRoutes';
import { createTreatmentPlanRoutes } from './treatmentPlanRoutes';
import { createPrescriptionRoutes } from './prescriptionRoutes';
import { ClinicalNoteController } from '../controllers/ClinicalNoteController';
import { DiagnosticReportController } from '../controllers/DiagnosticReportController';
import { TreatmentPlanController } from '../controllers/TreatmentPlanController';
import { PrescriptionController } from '../controllers/PrescriptionController';

export * from './clinicalNoteRoutes';
export * from './diagnosticReportRoutes';
export * from './treatmentPlanRoutes';
export * from './prescriptionRoutes';

/**
 * Setup all routes for the application
 */
export function setupRoutes(app: Express, container: DIContainer): void {
  // Get controllers from container
  const clinicalNoteController = container.resolve<ClinicalNoteController>('ClinicalNoteController');
  const diagnosticReportController = container.resolve<DiagnosticReportController>('DiagnosticReportController');
  const treatmentPlanController = container.resolve<TreatmentPlanController>('TreatmentPlanController');
  const prescriptionController = container.resolve<PrescriptionController>('PrescriptionController');

  // Mount routes
  app.use('/api/clinical/notes', createClinicalNoteRoutes(clinicalNoteController));
  app.use('/api/clinical/diagnostic-reports', createDiagnosticReportRoutes(diagnosticReportController));
  app.use('/api/clinical/treatment-plans', createTreatmentPlanRoutes(treatmentPlanController));
  app.use('/api/clinical/prescriptions', createPrescriptionRoutes(prescriptionController));
}
