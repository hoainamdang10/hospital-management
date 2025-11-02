/**
 * Express App Configuration Example
 * Shows how to wire up controllers and routes
 *
 * @compliance Clean Architecture, Dependency Injection
 */

import express, { Application } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  ClinicalNoteController,
  DiagnosticReportController,
  TreatmentPlanController,
  PrescriptionController,
} from './controllers';
import {
  createClinicalNoteRoutes,
  createDiagnosticReportRoutes,
  createTreatmentPlanRoutes,
  createPrescriptionRoutes,
} from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import repositories
import { SupabaseClinicalNoteRepository } from '../infrastructure/repositories/SupabaseClinicalNoteRepository';
import { SupabaseDiagnosticReportRepository } from '../infrastructure/repositories/SupabaseDiagnosticReportRepository';
import { SupabaseTreatmentPlanRepository } from '../infrastructure/repositories/SupabaseTreatmentPlanRepository';
import { SupabasePrescriptionRepository } from '../infrastructure/repositories/SupabasePrescriptionRepository';

// Import use cases
import {
  CreateClinicalNoteUseCase,
  GetClinicalNoteUseCase,
  UpdateClinicalNoteUseCase,
  CosignClinicalNoteUseCase,
  ListClinicalNotesUseCase,
  CreateDiagnosticReportUseCase,
  GetDiagnosticReportUseCase,
  UpdateDiagnosticReportUseCase,
  FinalizeDiagnosticReportUseCase,
  ListDiagnosticReportsUseCase,
  CreateTreatmentPlanUseCase,
  GetTreatmentPlanUseCase,
  UpdateTreatmentPlanUseCase,
  CompleteTreatmentPlanUseCase,
  ListTreatmentPlansUseCase,
  CreatePrescriptionUseCase,
  GetPrescriptionUseCase,
  DispensePrescriptionUseCase,
  ListPrescriptionsUseCase,
} from '../application/use-cases';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  // Initialize repositories
  const clinicalNoteRepo = new SupabaseClinicalNoteRepository(supabase);
  const diagnosticReportRepo = new SupabaseDiagnosticReportRepository(supabase);
  const treatmentPlanRepo = new SupabaseTreatmentPlanRepository(supabase);
  const prescriptionRepo = new SupabasePrescriptionRepository(supabase);

  // Initialize use cases - Clinical Notes
  const createNoteUseCase = new CreateClinicalNoteUseCase(clinicalNoteRepo);
  const getNoteUseCase = new GetClinicalNoteUseCase(clinicalNoteRepo);
  const updateNoteUseCase = new UpdateClinicalNoteUseCase(clinicalNoteRepo);
  const cosignNoteUseCase = new CosignClinicalNoteUseCase(clinicalNoteRepo);
  const listNotesUseCase = new ListClinicalNotesUseCase(clinicalNoteRepo);

  // Initialize use cases - Diagnostic Reports
  const createReportUseCase = new CreateDiagnosticReportUseCase(diagnosticReportRepo);
  const getReportUseCase = new GetDiagnosticReportUseCase(diagnosticReportRepo);
  const updateReportUseCase = new UpdateDiagnosticReportUseCase(diagnosticReportRepo);
  const finalizeReportUseCase = new FinalizeDiagnosticReportUseCase(diagnosticReportRepo);
  const listReportsUseCase = new ListDiagnosticReportsUseCase(diagnosticReportRepo);

  // Initialize use cases - Treatment Plans
  const createPlanUseCase = new CreateTreatmentPlanUseCase(treatmentPlanRepo);
  const getPlanUseCase = new GetTreatmentPlanUseCase(treatmentPlanRepo);
  const updatePlanUseCase = new UpdateTreatmentPlanUseCase(treatmentPlanRepo);
  const completePlanUseCase = new CompleteTreatmentPlanUseCase(treatmentPlanRepo);
  const listPlansUseCase = new ListTreatmentPlansUseCase(treatmentPlanRepo);

  // Initialize use cases - Prescriptions
  const createPrescriptionUseCase = new CreatePrescriptionUseCase(prescriptionRepo);
  const getPrescriptionUseCase = new GetPrescriptionUseCase(prescriptionRepo);
  const dispensePrescriptionUseCase = new DispensePrescriptionUseCase(prescriptionRepo);
  const listPrescriptionsUseCase = new ListPrescriptionsUseCase(prescriptionRepo);

  // Initialize controllers
  const clinicalNoteController = new ClinicalNoteController(
    createNoteUseCase,
    getNoteUseCase,
    updateNoteUseCase,
    cosignNoteUseCase,
    listNotesUseCase
  );

  const diagnosticReportController = new DiagnosticReportController(
    createReportUseCase,
    getReportUseCase,
    updateReportUseCase,
    finalizeReportUseCase,
    listReportsUseCase
  );

  const treatmentPlanController = new TreatmentPlanController(
    createPlanUseCase,
    getPlanUseCase,
    updatePlanUseCase,
    completePlanUseCase,
    listPlansUseCase
  );

  const prescriptionController = new PrescriptionController(
    createPrescriptionUseCase,
    getPrescriptionUseCase,
    dispensePrescriptionUseCase,
    listPrescriptionsUseCase
  );

  // Register routes
  app.use('/api/clinical-notes', createClinicalNoteRoutes(clinicalNoteController));
  app.use('/api/diagnostic-reports', createDiagnosticReportRoutes(diagnosticReportController));
  app.use('/api/treatment-plans', createTreatmentPlanRoutes(treatmentPlanController));
  app.use('/api/prescriptions', createPrescriptionRoutes(prescriptionController));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'clinical-emr-service', timestamp: new Date().toISOString() });
  });

  // Error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
